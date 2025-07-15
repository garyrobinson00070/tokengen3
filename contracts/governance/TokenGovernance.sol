// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenGovernance
 * @dev Governance contract for ERC20 tokens with voting capabilities
 */
contract TokenGovernance is Ownable, ReentrancyGuard {
    // Proposal struct
    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
        address proposer;
        mapping(address => Vote) votes;
        uint256 quorum; // Percentage of total supply (1-100)
        uint256 executionTime; // For time-locked execution
        bytes executionData; // Optional encoded function call data
    }

    // Vote struct
    enum VoteType { Against, For, Abstain }
    
    struct Vote {
        bool hasVoted;
        VoteType voteType;
        uint256 weight;
    }

    // The token used for voting
    ERC20Votes public token;
    
    // Proposal counter
    uint256 public proposalCount;
    
    // Mapping from proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;
    
    // Default quorum (percentage of total supply)
    uint256 public defaultQuorum = 10; // 10%
    
    // Default voting period (in seconds)
    uint256 public defaultVotingPeriod = 3 days;
    
    // Default time lock period (in seconds)
    uint256 public defaultTimeLockPeriod = 1 days;
    
    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event VoteCast(address indexed voter, uint256 indexed proposalId, uint8 voteType, uint256 weight);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event VotingPeriodUpdated(uint256 oldVotingPeriod, uint256 newVotingPeriod);
    event TimeLockPeriodUpdated(uint256 oldTimeLockPeriod, uint256 newTimeLockPeriod);

    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        token = ERC20Votes(address(_token));
    }

    /**
     * @dev Create a new proposal
     * @param title Title of the proposal
     * @param description Description of the proposal
     * @param executionData Optional encoded function call data for execution
     * @param quorum Optional custom quorum (percentage of total supply)
     * @param votingPeriod Optional custom voting period (in seconds)
     * @param timeLockPeriod Optional custom time lock period (in seconds)
     */
    function createProposal(
        string memory title,
        string memory description,
        bytes memory executionData,
        uint256 quorum,
        uint256 votingPeriod,
        uint256 timeLockPeriod
    ) external onlyOwner returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        // Use default values if not specified
        if (quorum == 0) quorum = defaultQuorum;
        if (votingPeriod == 0) votingPeriod = defaultVotingPeriod;
        if (timeLockPeriod == 0) timeLockPeriod = defaultTimeLockPeriod;
        
        // Validate parameters
        require(quorum > 0 && quorum <= 100, "Quorum must be between 1 and 100");
        require(votingPeriod >= 1 hours, "Voting period too short");
        
        // Increment proposal counter
        proposalCount++;
        
        // Create new proposal
        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.title = title;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;
        proposal.proposer = msg.sender;
        proposal.quorum = quorum;
        proposal.executionTime = proposal.endTime + timeLockPeriod;
        proposal.executionData = executionData;
        
        emit ProposalCreated(proposalCount, msg.sender, title);
        
        return proposalCount;
    }

    /**
     * @dev Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param voteType Type of vote (0=Against, 1=For, 2=Abstain)
     */
    function castVote(uint256 proposalId, uint8 voteType) external nonReentrant {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        require(voteType <= uint8(VoteType.Abstain), "Invalid vote type");
        
        Proposal storage proposal = proposals[proposalId];
        
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.canceled, "Proposal canceled");
        require(!proposal.votes[msg.sender].hasVoted, "Already voted");
        
        // Get voting weight (token balance)
        uint256 weight = token.getPastVotes(msg.sender, proposal.startTime - 1);
        require(weight > 0, "No voting power");
        
        // Record vote
        proposal.votes[msg.sender] = Vote({
            hasVoted: true,
            voteType: VoteType(voteType),
            weight: weight
        });
        
        // Update vote counts
        if (VoteType(voteType) == VoteType.For) {
            proposal.forVotes += weight;
        } else if (VoteType(voteType) == VoteType.Against) {
            proposal.againstVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }
        
        emit VoteCast(msg.sender, proposalId, voteType, weight);
    }

    /**
     * @dev Cancel a proposal (only proposer or owner)
     * @param proposalId ID of the proposal
     */
    function cancelProposal(uint256 proposalId) external {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Already canceled");
        require(msg.sender == proposal.proposer || msg.sender == owner(), "Not authorized");
        
        proposal.canceled = true;
        
        emit ProposalCanceled(proposalId);
    }

    /**
     * @dev Execute a proposal after voting period and time lock
     * @param proposalId ID of the proposal
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Proposal canceled");
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(block.timestamp >= proposal.executionTime, "Time lock not expired");
        
        // Check if proposal passed
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = token.totalSupply();
        
        // Check quorum
        require(totalVotes * 100 >= totalSupply * proposal.quorum, "Quorum not reached");
        
        // Check if proposal passed
        require(proposal.forVotes > proposal.againstVotes, "Proposal rejected");
        
        // Mark as executed
        proposal.executed = true;
        
        // Execute proposal if execution data is provided
        if (proposal.executionData.length > 0) {
            (bool success, ) = owner().call(proposal.executionData);
            require(success, "Execution failed");
        }
        
        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Get proposal details
     * @param proposalId ID of the proposal
     */
    function getProposal(uint256 proposalId) external view returns (
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        bool executed,
        bool canceled,
        address proposer,
        uint256 quorum,
        uint256 executionTime
    ) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        
        return (
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed,
            proposal.canceled,
            proposal.proposer,
            proposal.quorum,
            proposal.executionTime
        );
    }

    /**
     * @dev Get vote details for a specific voter
     * @param proposalId ID of the proposal
     * @param voter Address of the voter
     */
    function getVote(uint256 proposalId, address voter) external view returns (
        bool hasVoted,
        uint8 voteType,
        uint256 weight
    ) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        
        Vote memory vote = proposals[proposalId].votes[voter];
        
        return (
            vote.hasVoted,
            uint8(vote.voteType),
            vote.weight
        );
    }

    /**
     * @dev Get proposal state
     * @param proposalId ID of the proposal
     */
    function getProposalState(uint256 proposalId) external view returns (string memory) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal ID");
        
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.canceled) {
            return "Canceled";
        }
        
        if (proposal.executed) {
            return "Executed";
        }
        
        if (block.timestamp < proposal.startTime) {
            return "Pending";
        }
        
        if (block.timestamp <= proposal.endTime) {
            return "Active";
        }
        
        // Check if proposal passed
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = token.totalSupply();
        
        // Check quorum
        if (totalVotes * 100 < totalSupply * proposal.quorum) {
            return "Defeated (Quorum not reached)";
        }
        
        if (proposal.forVotes > proposal.againstVotes) {
            if (block.timestamp < proposal.executionTime) {
                return "Succeeded (In timelock)";
            } else {
                return "Succeeded (Ready for execution)";
            }
        } else {
            return "Defeated";
        }
    }

    /**
     * @dev Update default quorum (owner only)
     * @param newQuorum New default quorum (percentage of total supply)
     */
    function updateDefaultQuorum(uint256 newQuorum) external onlyOwner {
        require(newQuorum > 0 && newQuorum <= 100, "Quorum must be between 1 and 100");
        
        uint256 oldQuorum = defaultQuorum;
        defaultQuorum = newQuorum;
        
        emit QuorumUpdated(oldQuorum, newQuorum);
    }

    /**
     * @dev Update default voting period (owner only)
     * @param newVotingPeriod New default voting period (in seconds)
     */
    function updateDefaultVotingPeriod(uint256 newVotingPeriod) external onlyOwner {
        require(newVotingPeriod >= 1 hours, "Voting period too short");
        
        uint256 oldVotingPeriod = defaultVotingPeriod;
        defaultVotingPeriod = newVotingPeriod;
        
        emit VotingPeriodUpdated(oldVotingPeriod, newVotingPeriod);
    }

    /**
     * @dev Update default time lock period (owner only)
     * @param newTimeLockPeriod New default time lock period (in seconds)
     */
    function updateDefaultTimeLockPeriod(uint256 newTimeLockPeriod) external onlyOwner {
        uint256 oldTimeLockPeriod = defaultTimeLockPeriod;
        defaultTimeLockPeriod = newTimeLockPeriod;
        
        emit TimeLockPeriodUpdated(oldTimeLockPeriod, newTimeLockPeriod);
    }
}
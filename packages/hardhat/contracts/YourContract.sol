// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract YourContract {
    address public owner;

    struct Candidate {
        string name;        // Имя/описание кандидата
        uint256 voteCount;  // Количество полученных голосов
    }

    // Массив кандидатов
    Candidate[] public candidates;

    mapping(address => bool) public hasVoted;

    event CandidateAdded(string candidateName);
    event Voted(address indexed voter, uint256 candidateIndex);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Добавление нового кандидата (только владелец)
    function addCandidate(string memory _name) external onlyOwner {
        candidates.push(Candidate({name: _name, voteCount: 0}));
        emit CandidateAdded(_name);
    }

    // Функция голосования за определённого кандидата
    function vote(uint256 _candidateIndex) external {
        require(!hasVoted[msg.sender], "You have already voted.");
        require(_candidateIndex < candidates.length, "Invalid candidate index.");

        hasVoted[msg.sender] = true;
        candidates[_candidateIndex].voteCount++;

        emit Voted(msg.sender, _candidateIndex);
    }

    // Общее количество кандидатов
    function getCandidatesCount() external view returns (uint256) {
        return candidates.length;
    }

    // Возвращает информацию о конкретном кандидате
    function getCandidate(uint256 _index)
        external
        view
        returns (string memory name, uint256 voteCount)
    {
        require(_index < candidates.length, "Candidate does not exist.");
        Candidate storage candidate = candidates[_index];
        return (candidate.name, candidate.voteCount);
    }

    // Определяем победителя по максимальному количеству голосов
    function getWinner()
        public
        view
        returns (string memory winnerName, uint256 winnerVoteCount)
    {
        uint256 highestVoteCount = 0;
        uint256 winnerIndex = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > highestVoteCount) {
                highestVoteCount = candidates[i].voteCount;
                winnerIndex = i;
            }
        }

        winnerName = candidates[winnerIndex].name;
        winnerVoteCount = candidates[winnerIndex].voteCount;
    }
}

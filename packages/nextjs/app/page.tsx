"use client";

import React, { useEffect, useState } from "react";
import contractABI from "../../hardhat/artifacts/contracts/YourContract.sol/YourContract.json";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";

const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

interface Candidate {
  name: string;
  votes: number;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [owner, setOwner] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [winnerName, setWinnerName] = useState("");
  const [winnerVotes, setWinnerVotes] = useState(0);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [newCandidateName, setNewCandidateName] = useState("");

  // Функция возвращающая Contract или null
  async function getContract() {
    if (!walletClient) return null;

    const provider = new ethers.providers.Web3Provider(walletClient.transport);

    const signer = provider.getSigner();

    return new ethers.Contract(contractAddress, contractABI.abi, signer);
  }

  // 1. Получить адрес владельца
  async function fetchOwner() {
    try {
      const contract = await getContract();
      if (!contract) return;

      const ownerAddr: string = await contract.owner();
      setOwner(ownerAddr);
    } catch (error) {
      console.error("fetchOwner error:", error);
    }
  }

  // 2. Получить список кандидатов
  async function fetchCandidates() {
    try {
      const contract = await getContract();
      if (!contract) return;

      const count: ethers.BigNumber = await contract.getCandidatesCount();
      const arr: Candidate[] = [];
      for (let i = 0; i < count.toNumber(); i++) {
        const candidateData = await contract.getCandidate(i);
        const name = candidateData[0];
        const votesBN = candidateData[1];
        arr.push({ name, votes: votesBN.toNumber() });
      }
      setCandidates(arr);
    } catch (error) {
      console.error("fetchCandidates error:", error);
    }
  }

  // 3. Получить победителя
  async function fetchWinner() {
    try {
      const contract = await getContract();
      if (!contract) return;

      const result = await contract.getWinner();
      const wName = result[0];
      const wVotes = result[1].toNumber();

      setWinnerName(wName);
      setWinnerVotes(wVotes);
    } catch (error) {
      console.error("fetchWinner error:", error);
    }
  }

  // Функция для обновления всех данных
  async function reloadAll() {
    await fetchOwner();
    await fetchCandidates();
    await fetchWinner();
  }

  // 4. Голосование
  async function vote() {
    try {
      const contract = await getContract();
      if (!contract) return;

      const tx = await contract.vote(selectedCandidateIndex);
      console.log("vote tx hash:", tx.hash);

      await tx.wait();
      console.log("vote confirmed");

      await reloadAll();
    } catch (error) {
      console.error("vote error:", error);
    }
  }

  // 5. Добавить кандидата
  async function addCandidate() {
    try {
      const contract = await getContract();
      if (!contract) return;

      const tx = await contract.addCandidate(newCandidateName);
      console.log("addCandidate tx hash:", tx.hash);

      await tx.wait();
      console.log("addCandidate confirmed");

      // Очищаем ввод
      setNewCandidateName("");
      // Обновляем данные
      await reloadAll();
    } catch (error) {
      console.error("addCandidate error:", error);
    }
  }

  // Загружаем данные при первом монтировании
  useEffect(() => {
    if (isConnected) {
      reloadAll();
    }
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-blue-100 text-gray-800 p-4">
      <div className="max-w-3xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Voting DApp</h1>

        {!isConnected && (
          <p className="text-center text-red-500">
            Пожалуйста, подключите кошелёк, чтобы взаимодействовать с приложением.
          </p>
        )}

        {/* Основной контент, когда кошелёк подключён */}
        {isConnected && (
          <div className="space-y-6">
            {/* Информация о текущем пользователе и владельце контракта */}
            <div className="bg-white shadow-md rounded p-4">
              <p>
                <span className="font-semibold">Ваш адрес:</span> {address}
              </p>
              <p>
                <span className="font-semibold">Владелец контракта:</span> {owner}
              </p>
            </div>

            {/* Список кандидатов */}
            <div className="bg-white shadow-md rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">Список кандидатов</h2>
                <button
                  onClick={fetchCandidates}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                >
                  Обновить
                </button>
              </div>
              {candidates.length === 0 ? (
                <p className="text-gray-500">Пока кандидатов нет.</p>
              ) : (
                <ul className="list-disc list-inside">
                  {candidates.map((cand, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">#{idx}</span>: {cand.name} —{" "}
                      <span className="font-semibold">{cand.votes}</span> голосов
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Голосование */}
            <div className="bg-white shadow-md rounded p-4 flex flex-col space-y-4">
              <h3 className="text-lg font-semibold">Голосование</h3>
              <div className="flex items-center space-x-2">
                <label htmlFor="candidateIndex">Индекс кандидата:</label>
                <input
                  id="candidateIndex"
                  type="number"
                  className="border rounded px-2 py-1 w-20"
                  value={selectedCandidateIndex}
                  onChange={e => setSelectedCandidateIndex(Number(e.target.value))}
                />
                <button onClick={vote} className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded">
                  Голосовать
                </button>
              </div>
            </div>

            {/* Победитель */}
            <div className="bg-white shadow-md rounded p-4">
              <h3 className="text-lg font-semibold mb-2">Текущий победитель</h3>
              {winnerName ? (
                <p>
                  <span className="font-semibold">{winnerName}</span> с{" "}
                  <span className="font-semibold">{winnerVotes}</span> голосами
                </p>
              ) : (
                <p className="text-gray-500">Пока нет данных</p>
              )}
              <button onClick={fetchWinner} className="mt-3 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded">
                Обновить
              </button>
            </div>

            {/* Добавление кандидата  */}
            {address?.toLowerCase() === owner?.toLowerCase() && (
              <div className="bg-white shadow-md rounded p-4 flex flex-col space-y-4">
                <h3 className="text-lg font-semibold">Добавить кандидата (для владельца)</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Имя кандидата"
                    className="border rounded px-2 py-1"
                    value={newCandidateName}
                    onChange={e => setNewCandidateName(e.target.value)}
                  />
                  <button
                    onClick={addCandidate}
                    className="bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded"
                  >
                    Добавить
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

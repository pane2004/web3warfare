"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createPublicClient, http, Address, parseAbiItem } from "viem";
import { sepolia } from "viem/chains";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const bountyDuelABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_placer",
        type: "address",
      },
      {
        internalType: "address",
        name: "_target",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_bountyAmount",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "winner",
        type: "address",
      },
    ],
    name: "DuelEnded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "challenger",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "DuelStarted",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_winner",
        type: "address",
      },
    ],
    name: "endDuel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "logReload",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_shooter",
        type: "address",
      },
      {
        internalType: "address",
        name: "_target",
        type: "address",
      },
    ],
    name: "logShotFired",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "winner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Payout",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "Reload",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "shooter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "ShotFired",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_challenger",
        type: "address",
      },
    ],
    name: "startDuel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "active",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bountyAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "challenger",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "completed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "placer",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "target",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "winner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

type BattleEvent = {
  type: "DuelStarted" | "ShotFired" | "Reload" | "DuelEnded" | "Payout";
  data: string;
};

export default function BattlePage() {
  const { battleId } = useParams();
  const searchParams = useSearchParams();
  const contractAddress = searchParams.get("contract") as Address;
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { primaryWallet } = useDynamicContext();
  const { toast } = useToast();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const logs = await publicClient.getLogs({
          address: contractAddress,
          events: [
            parseAbiItem(
              "event DuelStarted(address indexed challenger, address indexed target)"
            ),
            parseAbiItem("event ShotFired(address shooter, address target)"),
            parseAbiItem("event Reload(address user)"),
            parseAbiItem("event DuelEnded(address winner)"),
            parseAbiItem(
              "event Payout(address indexed winner, uint256 amount)"
            ),
          ],
          fromBlock: "earliest",
        });

        const formattedEvents = logs.map((log) => ({
          type: log.eventName,
          data: log.args,
        })) as BattleEvent[];

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to fetch battle events. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [contractAddress, publicClient, toast]);

  const handleAction = async (action: "shoot" | "reload" | "end") => {
    if (!primaryWallet) {
      toast({
        title: "Error",
        description: "Please connect your wallet to perform actions.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Refetch events
      // This is a simplified approach. In a real app, you might want to use websockets or polling for real-time updates.
      const newEvents = await publicClient.getLogs({
        address: contractAddress,
        events: [
          parseAbiItem(
            "event DuelStarted(address indexed challenger, address indexed target)"
          ),
          parseAbiItem("event ShotFired(address shooter, address target)"),
          parseAbiItem("event Reload(address user)"),
          parseAbiItem("event DuelEnded(address winner)"),
          parseAbiItem("event Payout(address indexed winner, uint256 amount)"),
        ],
        fromBlock: "earliest",
      });

      setEvents(
        newEvents.map((log) => ({
          type: log.eventName,
          data: log.args,
        })) as BattleEvent[]
      );
    } catch (err) {
      console.error("Error performing action:", err);
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading battle data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Battle Arena</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Battle {battleId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold">Challenger</div>
            <div className="text-lg font-semibold">Target</div>
          </div>
          <div className="flex justify-between items-center mb-8">
            <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-4xl">
              🤠
            </div>
            <div className="text-4xl">⚔️</div>
            <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-4xl">
              🤠
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Battle Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {events.map((event, index) => (
              <li key={index} className="border-b pb-2">
                <strong>{event.type}:</strong> {JSON.stringify(event.data)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

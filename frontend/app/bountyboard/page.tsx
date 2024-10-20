"use client";

import { useState, useEffect } from "react";
import {
  createPublicClient,
  http,
  parseEther,
  formatGwei,
  Address,
} from "viem";
import { sepolia } from "viem/chains";
import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const contractABI = [
  {
    inputs: [],
    name: "getAllBounties",
    outputs: [
      {
        internalType: "contract BountyDuel[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_target",
        type: "address",
      },
    ],
    name: "createBounty",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const contractAddress = "0x9F9d3950245227b103fF302E00fDaeD41a3e5157";

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

type Bounty = {
  address: Address;
  placer: Address;
  target: Address;
  amount: bigint;
};

const placeholderBounties: Bounty[] = [
  {
    address: "0x1234567890123456789012345678901234567890",
    placer: "0x2345678901234567890123456789012345678901",
    target: "0x3456789012345678901234567890123456789012",
    amount: BigInt(1000000000000000000), // 1 ETH
  },
  {
    address: "0x4567890123456789012345678901234567890123",
    placer: "0x5678901234567890123456789012345678901234",
    target: "0x6789012345678901234567890123456789012345",
    amount: BigInt(500000000000000000), // 0.5 ETH
  },
];

export default function BountyBoard() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetAddress, setTargetAddress] = useState("");
  const [bountyAmount, setBountyAmount] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const isLoggedIn = useIsLoggedIn();
  const { sdkHasLoaded, primaryWallet } = useDynamicContext();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  useEffect(() => {
    if (sdkHasLoaded && isLoggedIn && primaryWallet) {
      fetchBounties();
    }
  }, [sdkHasLoaded, isLoggedIn, primaryWallet]);

  const fetchBounties = async () => {
    try {
      const bountyAddresses = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "getAllBounties",
      });

      const fetchedBounties = await Promise.all(
        bountyAddresses.map(async (address) => {
          const [placer, target, amount] = await Promise.all([
            publicClient.readContract({
              address,
              abi: bountyDuelABI,
              functionName: "placer",
            }),
            publicClient.readContract({
              address,
              abi: bountyDuelABI,
              functionName: "target",
            }),
            publicClient.readContract({
              address,
              abi: bountyDuelABI,
              functionName: "bountyAmount",
            }),
          ]);

          return { address, placer, target, amount };
        })
      );

      setBounties([...placeholderBounties, ...fetchedBounties]);
    } catch (err) {
      console.error("Error fetching bounties:", err);
      setError("Failed to fetch bounties. Please try again later.");
      setBounties(placeholderBounties);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      toast({
        title: "Error",
        description: "Please connect an Ethereum wallet to create a bounty.",
        variant: "destructive",
      });
      return;
    }

    try {
      const walletClient = await primaryWallet.getWalletClient();

      const { request } = await publicClient.simulateContract({
        account: primaryWallet.address as Address,
        address: contractAddress,
        abi: contractABI,
        functionName: "createBounty",
        args: [targetAddress as Address],
        value: parseEther(bountyAmount),
      });

      const hash = await walletClient.writeContract(request);

      toast({
        title: "Bounty Created",
        description: `Transaction hash: ${hash}`,
      });

      // Wait for the transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });

      // Refresh the bounty list
      fetchBounties();

      // Clear the form
      setTargetAddress("");
      setBountyAmount("");
    } catch (err) {
      console.error("Error creating bounty:", err);
      toast({
        title: "Error",
        description: "Failed to create bounty. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChallenge = async (bountyAddress: Address) => {
    if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
      toast({
        title: "Error",
        description: "Please connect an Ethereum wallet to challenge a bounty.",
        variant: "destructive",
      });
      return;
    }

    try {
      const walletClient = await primaryWallet.getWalletClient();

      const { request } = await publicClient.simulateContract({
        account: primaryWallet.address as Address,
        address: bountyAddress,
        abi: bountyDuelABI,
        functionName: "startDuel",
        args: [primaryWallet.address as Address],
      });

      const hash = await walletClient.writeContract(request);

      toast({
        title: "Challenge Initiated",
        description: `Transaction hash: ${hash}`,
      });

      await publicClient.waitForTransactionReceipt({ hash });

      const battleId = hash;

      router.push(`/bountyboard/${battleId}?contract=${bountyAddress}`);
    } catch (err) {
      console.error("Error challenging bounty:", err);
      toast({
        title: "Error",
        description: "Failed to challenge bounty. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!sdkHasLoaded || !isLoggedIn) {
    return <div>Please log in to view the Bounty Board.</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bounty Board</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Bounty</CardTitle>
          <CardDescription>
            Enter the target address and bounty amount to create a new bounty.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBounty} className="space-y-4">
            <div>
              <Label htmlFor="targetAddress">Target Address</Label>
              <Input
                id="targetAddress"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <Label htmlFor="bountyAmount">Bounty Amount (ETH)</Label>
              <Input
                id="bountyAmount"
                type="number"
                step="0.000000000000000001"
                value={bountyAmount}
                onChange={(e) => setBountyAmount(e.target.value)}
                placeholder="0.1"
                required
              />
            </div>
            <Button type="submit">Create Bounty</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array(3)
              .fill(0)
              .map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
          : bounties.map((bounty) => (
              <Card key={bounty.address}>
                <CardHeader>
                  <CardTitle>Bounty</CardTitle>
                  <CardDescription>
                    Amount: {formatGwei(bounty.amount)} gwei
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">
                    Contract: {bounty.address}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Placer: {bounty.placer}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Target: {bounty.target}
                  </p>
                  <a
                    href={`https://sepolia.etherscan.org/address/${bounty.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mb-4 inline-block"
                  >
                    View on Sepolia Basescan
                  </a>
                  <Button
                    onClick={() => handleChallenge(bounty.address)}
                    className="w-full mt-4"
                  >
                    Challenge to Duel
                  </Button>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}

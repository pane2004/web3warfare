"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DynamicWidget } from "@/lib/dynamic";
import { Inbox, ShoppingBag, User, UserCircle } from "lucide-react";

const tabs = [
  { id: "events", label: "Events", icon: Inbox, href: "/events" },
  { id: "bounties", label: "Bounty Board", icon: UserCircle, href: "/bountyboard" },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    href: "/marketplace",
  },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Web3Warfare</h1>
      </div>
      <nav className="flex-1">
        <ul>
          {tabs.map((tab) => (
            <li key={tab.id}>
              <Link
                href={tab.href}
                className={`flex items-center w-full px-4 py-2 text-left ${
                  pathname === tab.href ? "bg-gray-800" : "hover:bg-gray-800"
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4">
        <DynamicWidget />
      </div>
    </div>
  );
}

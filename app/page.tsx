"use client";

import USDTLiveGraph from "./components/USDTLiveGraph";
import { AnimatedCounter } from "./components/ui/counter";
import { useEffect, useState } from "react";

export default function Home() {

  return (
    <div className="font-sans w-full min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-neutral-900 flex flex-col items-center">
      <h1 className="text-3xl font-extrabold mb-8 text-white drop-shadow">CryptoBazaar Dashboard</h1>

        <div className="flex flex-col items-center mt-8">
          <div className="text-xl font-semibold text-neutral-200 mb-2">Total Volume</div>
          <AnimatedCounter end={1000000} duration={3000} className="text-6xl font-extrabold text-yellow-400 drop-shadow-lg" />
        </div>
      </div>
  );
}

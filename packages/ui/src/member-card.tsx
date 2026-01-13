"use client";

import React from "react";

import { Button } from "./button";

/**
 * Performs  member card operation.
 * @param {any} { member, onToggle } - Description of { member, onToggle }
 * @returns {any} Description of return value
 */
export function MemberCard({ member, onToggle }: any) {
  const alive = member.user.status;

  return (
    <div
      className={`
        relative p-5 rounded-2xl border
        backdrop-blur-xl
        transition-all duration-300
        shadow-[0_0_25px_rgba(0,0,0,0.35)]
        hover:shadow-[0_0_40px_rgba(0,0,0,0.55)]
        ${
          alive
            ? "bg-white/10 border-white/20"
            : "bg-red-500/10 border-red-500/30"
        }
      `}
    >
      <div className="flex items-center gap-4">
        {/* Avatar Circle */}
        <div
          className={`
            w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold
            shadow-inner
            backdrop-blur-xl
            ${
              alive
                ? "bg-blue-500/20 text-blue-300"
                : "bg-red-500/20 text-red-300"
            }
          `}
        >
          {member.user.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div
            className={`text-xl font-semibold ${
              alive ? "text-white" : "text-red-200"
            }`}
          >
            {member.user.name}
          </div>
          <div className="text-sm text-gray-300">{member.user.email}</div>
        </div>

        {/* Button */}
        <Button
          variant={alive ? "danger" : "primary"}
          className="!px-4 !py-1.5 text-sm rounded-xl"
          onClick={() => onToggle(member.user.id, alive)}
        >
          Mark {alive ? "Dead" : "Alive"}
        </Button>
      </div>
    </div>
  );
}

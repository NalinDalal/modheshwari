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
        rounded-2xl p-5 border backdrop-blur-xl
        transition-all duration-300
        hover:-translate-y-[2px]
        hover:shadow-[0_15px_45px_rgba(0,0,0,0.25)]
        ${
          alive
            ? "bg-white/6 border-white/10"
            : "bg-red-500/8 border-red-500/20"
        }
      `}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div
            className={`
              w-12 h-12 rounded-2xl flex items-center justify-center
              text-lg font-bold shrink-0
              ${
                alive
                  ? "bg-blue-500/20 text-blue-200"
                  : "bg-red-500/20 text-red-200"
              }
            `}
          >
            {member.user.name?.charAt(0)?.toUpperCase()}
          </div>

          {/* Name + Email */}
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">
              {member.user.name}
            </p>
            <p className="text-sm text-white/60 truncate">
              {member.user.email}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`
            text-[11px] px-2 py-1 rounded-full border shrink-0
            ${
              alive
                ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/20"
                : "bg-red-500/10 text-red-200 border-red-500/20"
            }
          `}
        >
          {alive ? "Alive" : "Dead"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 my-4" />

      {/* Action */}
      <Button
        variant={alive ? "danger" : "primary"}
        className="w-full rounded-xl"
        onClick={() => onToggle(member.user.id, alive)}
      >
        Mark {alive ? "Dead" : "Alive"}
      </Button>
    </div>
  );
}

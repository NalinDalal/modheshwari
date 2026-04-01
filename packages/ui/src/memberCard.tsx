"use client";

import React from "react";

import { Button } from "./button";

export function MemberCard({ member, onToggle }: any) {
  const alive = member.user.status;

  return (
    <div
      className={`
        rounded-2xl p-5 border backdrop-blur-xl
        transition-all duration-300
        hover:-translate-y-[2px]
        hover:shadow-jewel
        ${
          alive
            ? "bg-jewel-50/60 border-jewel-400/20"
            : "bg-jewel-ruby/5 border-jewel-ruby/20"
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`
              w-12 h-12 rounded-2xl flex items-center justify-center
              text-lg font-bold shrink-0
              ${
                alive
                  ? "bg-jewel-gold/20 text-jewel-gold"
                  : "bg-jewel-ruby/20 text-jewel-ruby"
              }
            `}
          >
            {member.user.name?.charAt(0)?.toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-jewel-900 truncate">
              {member.user.name}
            </p>
            <p className="text-sm text-jewel-600 truncate">
              {member.user.email}
            </p>
          </div>
        </div>

        <span
          className={`
            text-[11px] px-2 py-1 rounded-full border shrink-0
            ${
              alive
                ? "bg-jewel-emerald/10 text-jewel-emerald border-jewel-emerald/20"
                : "bg-jewel-ruby/10 text-jewel-ruby border-jewel-ruby/20"
            }
          `}
        >
          {alive ? "Alive" : "Deceased"}
        </span>
      </div>

      <div className="h-px bg-jewel-400/20 my-4" />

      <Button
        variant={alive ? "danger" : "primary"}
        className="w-full rounded-xl"
        onClick={() => onToggle(member.user.id, alive)}
      >
        Mark {alive ? "Deceased" : "Alive"}
      </Button>
    </div>
  );
}

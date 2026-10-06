"use client";

import { Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ClubOption {
  id: string;
  name: string;
}

const PARTICULAR_VALUE = "particular";

/**
 * "¿Para quién es esto?" — lets a coach tag what they're creating as
 * particular (personal) work or as work for a club they belong to. Only
 * rendered when the coach has at least one club membership; otherwise
 * there's nothing to choose and the field stays implicitly "particular".
 */
export function ClubContextSelect({
  value,
  onChange,
  clubs,
  label = "¿Para quién es esto?",
  className,
}: {
  value: string | null;
  onChange: (clubId: string | null) => void;
  clubs: ClubOption[];
  label?: string;
  className?: string;
}) {
  if (clubs.length === 0) return null;

  return (
    <div className={className ?? "space-y-2"}>
      <Label className="flex items-center gap-1.5">
        <Building2 className="size-3.5 text-foreground/50" />
        {label}
      </Label>
      <Select
        value={value ?? PARTICULAR_VALUE}
        onValueChange={(next) =>
          onChange(next === PARTICULAR_VALUE ? null : (next ?? null))
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Particular" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={PARTICULAR_VALUE}>Particular</SelectItem>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

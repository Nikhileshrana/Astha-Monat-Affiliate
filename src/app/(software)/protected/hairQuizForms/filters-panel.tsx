"use client";

import { useEffect, useState } from "react";
import { Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { countActiveFilters } from "@/lib/hair-quiz/queries";
import {
  EMPTY_HAIR_QUIZ_FILTERS,
  FIELD_LABELS,
  FILTER_ENUMS,
  type HairQuizFilterOptions,
  type HairQuizListFilters,
} from "@/lib/hair-quiz/schema";

const FORM_FILTER_SECTIONS: {
  title: string;
  key: Exclude<keyof typeof FILTER_ENUMS, "treatmentStatus">;
}[] = [
  { title: "Contact preference", key: "contactPreference" },
  { title: "Budget", key: "budget" },
  { title: "Hair thickness", key: "hairThickness" },
  { title: "Hair texture", key: "hairTexture" },
  { title: "Roots", key: "rootType" },
  { title: "Ends", key: "endsType" },
  { title: "Dandruff / itchy scalp", key: "hasDandruffOrItchyScalp" },
  { title: "Frizzy", key: "getsFrizzy" },
  { title: "Hot tools", key: "hotToolsFrequency" },
  { title: "Hairloss concern", key: "hairlossConcern" },
  { title: "Colour treated", key: "isColorTreated" },
];

function CheckboxGroup({
  id,
  options,
  values,
  onChange,
}: {
  id: string;
  options: readonly string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (value: string, checked: boolean) => {
    onChange(
      checked ? [...values, value] : values.filter((item) => item !== value),
    );
  };

  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <div key={option} className="flex items-center gap-2">
          <Checkbox
            id={`${id}-${option}`}
            checked={values.includes(option)}
            onCheckedChange={(checked) => toggle(option, checked === true)}
          />
          <Label
            htmlFor={`${id}-${option}`}
            className="font-normal normal-case tracking-normal"
          >
            {FIELD_LABELS[option] ?? option}
          </Label>
        </div>
      ))}
    </div>
  );
}

export function HairQuizFiltersPanel({
  appliedFilters,
  filterOptions,
  onApply,
}: {
  appliedFilters: HairQuizListFilters;
  filterOptions: HairQuizFilterOptions;
  onApply: (filters: HairQuizListFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<HairQuizListFilters>(appliedFilters);
  const activeCount = countActiveFilters(appliedFilters);
  const draftCount = countActiveFilters(draft);

  useEffect(() => {
    if (open) setDraft(appliedFilters);
  }, [open, appliedFilters]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 ? (
            <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md!"
      >
        <SheetHeader className="border-b">
          <SheetTitle>Filter submissions</SheetTitle>
          <SheetDescription>
            Location, status, hair profile, budget, and contact preference.
            {draftCount > 0 ? ` ${draftCount} active.` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-5 p-4">
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Treatment status
                </p>
                <CheckboxGroup
                  id="treatmentStatus"
                  options={FILTER_ENUMS.treatmentStatus}
                  values={draft.treatmentStatus}
                  onChange={(values) =>
                    setDraft((prev) => ({ ...prev, treatmentStatus: values }))
                  }
                />
              </section>

              <Separator />

              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Location
                </p>
                {(
                  [
                    ["IP country", "ipCountry", filterOptions.ipCountries],
                    ["IP city", "ipCity", filterOptions.ipCities],
                    ["Phone country", "phoneCountry", filterOptions.phoneCountries],
                  ] as const
                ).map(([label, key, options]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-xs">{label}</Label>
                    <Select
                      value={draft[key] || "__all__"}
                      onValueChange={(value) =>
                        setDraft((prev) => ({
                          ...prev,
                          [key]: value === "__all__" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`All ${label.toLowerCase()}s`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All</SelectItem>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </section>

              <Separator />

              {FORM_FILTER_SECTIONS.map((section) => (
                <section key={section.key} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.title}
                  </p>
                  <CheckboxGroup
                    id={section.key}
                    options={FILTER_ENUMS[section.key]}
                    values={draft[section.key]}
                    onChange={(values) =>
                      setDraft((prev) => ({ ...prev, [section.key]: values }))
                    }
                  />
                </section>
              ))}
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="border-t sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="sm:order-1"
            disabled={draftCount === 0}
            onClick={() => setDraft(EMPTY_HAIR_QUIZ_FILTERS)}
          >
            Reset draft
          </Button>
          <div className="flex w-full flex-col gap-2 sm:order-2 sm:w-auto sm:flex-row">
            <SheetClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </SheetClose>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                onApply(EMPTY_HAIR_QUIZ_FILTERS);
                setOpen(false);
              }}
            >
              Clear all
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                onApply(draft);
                setOpen(false);
              }}
            >
              Apply filters
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

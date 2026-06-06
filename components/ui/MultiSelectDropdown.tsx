"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type MultiSelectDropdownProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

export default function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !ref.current) {
      return;
    }

    const updatePanelPosition = () => {
      if (!ref.current) {
        return;
      }

      const rect = ref.current.getBoundingClientRect();
      setPanelPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    };

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => onChange([]);

  const displayLabel =
    selected.length === 0 ? label : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  const dropdownPanel = (
    <div
      onMouseDown={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        top: panelPosition.top,
        left: panelPosition.left,
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 8,
        padding: "6px 0",
        minWidth: 200,
        maxHeight: 280,
        overflowY: "auto",
        zIndex: 99999,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
      }}
    >
      {selected.length > 0 ? (
        <div
          onClick={clearAll}
          style={{
            padding: "6px 12px",
            color: "#f0a500",
            fontSize: 11,
            cursor: "pointer",
            borderBottom: "1px solid #21262d",
            marginBottom: 4
          }}
        >
          Clear all ({selected.length} selected)
        </div>
      ) : null}

      {options.map((option) => {
        const isSelected = selected.includes(option);

        return (
          <div
            key={option}
            onClick={() => toggleOption(option)}
            style={{
              padding: "7px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: 12,
              color: isSelected ? "#f0a500" : "#e6edf3",
              backgroundColor: isSelected ? "rgba(240,165,0,0.08)" : "transparent"
            }}
            onMouseEnter={(event) => {
              if (!isSelected) {
                event.currentTarget.style.backgroundColor = "#1c2128";
              }
            }}
            onMouseLeave={(event) => {
              if (!isSelected) {
                event.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                border: isSelected ? "2px solid #f0a500" : "2px solid #444c56",
                backgroundColor: isSelected ? "#f0a500" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {isSelected ? (
                <span style={{ color: "#0d1117", fontSize: 10, fontWeight: 700 }}>
                  {"\u2713"}
                </span>
              ) : null}
            </div>
            {option}
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        style={{
          height: 28,
          padding: "0 10px",
          backgroundColor: selected.length > 0 ? "rgba(240,165,0,0.1)" : "#061322",
          border: selected.length > 0 ? "1px solid #f0a500" : "1px solid #223a59",
          borderRadius: 6,
          color: selected.length > 0 ? "#f0a500" : "#e6edf3",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          minWidth: 120
        }}
      >
        <span style={{ flex: 1, textAlign: "left" }}>{displayLabel}</span>
        {selected.length > 0 ? (
          <span
            onClick={(event) => {
              event.stopPropagation();
              clearAll();
            }}
            style={{ color: "#f0a500", fontSize: 14, lineHeight: 1 }}
          >
            {"\u00d7"}
          </span>
        ) : null}
        <span style={{ fontSize: 10, opacity: 0.6 }}>{isOpen ? "\u25b2" : "\u25bc"}</span>
      </button>

      {isOpen ? createPortal(dropdownPanel, document.body) : null}
    </div>
  );
}

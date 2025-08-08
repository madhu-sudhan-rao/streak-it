import React, { useState, useRef, useEffect } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import "./EmojiInput.css";
import type { Emoji } from "../../models/emoji.model";

// Define the props for the EmojiInput component
interface EmojiInputProps {
    value?: string;
    onChange?: (emoji: string) => void;
}

export default function EmojiInput({ value, onChange }: EmojiInputProps) {
  const [emoji, setEmoji] = useState(value || "");
  const [pickerOpen, setPickerOpen] = useState(false);
const pickerRef = useRef<HTMLDivElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
           pickerRef.current &&
      !pickerRef.current.contains(e.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  function handleEmojiSelect(emojiObj: Emoji) {
    setEmoji(emojiObj.native);
    setPickerOpen(false);
    if (onChange) onChange(emojiObj.native);
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="emoji-button"
        ref={buttonRef}
        type="button"
        aria-label="Pick your emoji"
        onClick={() => setPickerOpen((o) => !o)}
      >
        {emoji || "😊"}
      </button>

      {pickerOpen && (
        <div
          ref={pickerRef}
          style={{
            position: "absolute",
            zIndex: 9999,
            top: "110%",
            left: 0,
          }}
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            perLine={9}
          />
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import "./EmojiInput.css";

export default function EmojiInput({ value, onChange }) {
  const [emoji, setEmoji] = useState(value || "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  function handleEmojiSelect(emojiObj) {
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

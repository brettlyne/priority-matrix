import React from "react";

export const writeTextToClipboard = (str: string) => {
  const prevActive = document.activeElement;
  const textArea = document.createElement("textarea");

  textArea.value = str;

  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";

  document.body.appendChild(textArea);

  textArea.focus();
  textArea.select();

  return new Promise<void>((res, rej) => {
    document.execCommand("copy") ? res() : rej();
    textArea.remove();

    if (prevActive && prevActive instanceof HTMLElement) {
      prevActive.focus();
    }
  });
};

export const Logo = () => (
  <svg
    className="logo"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 260 28"
    width="260px"
    height="28px"
  >
    <path
      fill="#385959"
      d="M12 0h236v28H12zM256 8h4v4h-4zM252 4h4v4h-4zM248 0h4v4h-4zM256 16h4v4h-4zM252 12h4v4h-4zM248 4h4v8h-4zM256 24h4v4h-4zM252 20h4v4h-4z"
    />
    <path
      fill="#fff"
      d="M28 16h-4v8h-4V4h12.1v4h-8v4h4v4Zm.1-8h4v8h-4V8ZM36.6 4h12v4h-8v4h4v4h4v8h-4v-8h-4v8h-4V4Zm8 4h4v4h-4V8ZM53.1 4h4v20h-4V4ZM61.7 4h4v20h-4V4Zm4 0h8v20h-8v-4h4V8h-4V4ZM78.3 4h12v4h-8v4h4v4h4v8h-4v-8h-4v8h-4V4Zm8 4h4v4h-4V8ZM94.8 4h4v20h-4V4ZM103.3 4h12v4h-4v16h-4V8h-4V4ZM119.9 4h3.9v8h4V4h4v12h-4v8h-4v-8h-4V4ZM145 4h4v4h4v4h4V8h4V4h4v20h-4V12h-4v4h-4v-4h-4v12h-4V4ZM169.5 4h12v20h-4V8h-4v16h-4V4Zm4 8h4v4h-4v-4ZM186 4h12v4h-4v16h-3.9V8h-4V4ZM202.7 4h12v4h-8v4h4v4h4v8h-4v-8h-4v8h-4V4Zm8 4h4v4h-4V8ZM219.2 4h4v20h-4V4ZM227.8 4h4v8h4V4h4v8h-4v4h4v8h-4v-8h-4v8h-4v-8h4v-4h-4V4Z"
    />
    <path
      fill="#385959"
      d="M4 0H0v4h4zM8 4H4v4h4zM12 8H8v4h4zM4 8H0v4h4zM8 12H4v4h4zM12 16H8v9h4zM4 16H0v4h4zM8 20H4v4h4z"
    />
    <path fill="#385959" d="M12 24H8v4h4z" />
  </svg>
);

export const IconX = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 20 20"
    width="20px"
    height="20px"
  >
    <circle cx="10" cy="10" r="10" fill="#FF8989" />
    <path stroke="#fff" strokeWidth="2" d="m6 6 8 8M14 6l-8 8" />
  </svg>
);

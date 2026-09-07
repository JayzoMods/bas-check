"use client";

import { useId, useState } from "react";

export function FileField({
  name,
  accept,
  required,
  labelledBy,
}: {
  name: string;
  accept: string;
  required?: boolean;
  labelledBy: string;
}) {
  const id = useId();
  const [fileName, setFileName] = useState("No file chosen");

  return (
    <div className="file-picker">
      <input
        id={id}
        className="sr-only"
        type="file"
        name={name}
        accept={accept}
        required={required}
        aria-labelledby={labelledBy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          setFileName(file ? file.name : "No file chosen");
        }}
      />
      <label className="btn btn-ghost" htmlFor={id}>
        Choose file
      </label>
      <span className="file-picker-name">{fileName}</span>
    </div>
  );
}

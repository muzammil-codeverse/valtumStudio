"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
export type BookPage = {
  title: string;
  body: string;
  image: string;
  alt: string;
  note: string;
};
export function TurningBook({
  pages,
  label = "Inside the work"
}: {
  pages: ReadonlyArray<BookPage>;
  label?: string;
}): React.JSX.Element {
  const [page, setPage] = useState(0),
    [turn, setTurn] = useState<"next" | "previous" | null>(null);
  const [turnTarget, setTurnTarget] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    pointer = useRef(0);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const current = pages[page] ?? pages[0];
  if (!current) return <></>;
  const target = pages[turnTarget ?? (page + 1) % pages.length] ?? current;
  function select(index: number, direction?: "next" | "previous") {
    if (turn || index === page) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPage(index);
      return;
    }
    setTurnTarget(index);
    setTurn(direction ?? (index < page ? "previous" : "next"));
    timer.current = setTimeout(() => {
      setPage(index);
      setTurn(null);
      setTurnTarget(null);
    }, 850);
  }
  return (
    <div className="x-journal" aria-label={label}>
      <div
        className={`x-book ${turn ? `is-turning turn-${turn}` : ""}`}
        onPointerDown={(event) => {
          pointer.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const delta = event.clientX - pointer.current;
          if (Math.abs(delta) > 65)
            select((page + (delta < 0 ? 1 : -1) + pages.length) % pages.length);
        }}
      >
        <div className="x-book-stock" aria-hidden="true" />
        <div className="x-book-spread">
          <div className="x-book-photo">
            <Image
              src={current.image}
              alt={current.alt}
              fill
              sizes="(max-width:760px) 80vw, 40vw"
            />
            <span className="x-book-tape" aria-hidden="true" />
            <span className="x-book-photo-note">{current.note}</span>
          </div>
          <div className="x-book-reading" aria-live="polite">
            <span className="x-book-monogram" aria-hidden="true">
              V.
            </span>
            <h3>{current.title}</h3>
            <p>{current.body}</p>
            <span className="x-book-page">
              {page + 1} / {pages.length}
            </span>
          </div>
        </div>
        <div className="x-book-binding" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        {turn && (
          <div className={`x-book-leaf leaf-${turn}`} aria-hidden="true">
            <div className="x-leaf-front">
              <h3>{current.title}</h3>
              <p>{current.body}</p>
            </div>
            <div className="x-leaf-back">
              <Image src={target.image} alt="" fill sizes="40vw" />
            </div>
          </div>
        )}
      </div>
      <div className="x-book-controls">
        <button
          aria-label="Previous page"
          disabled={Boolean(turn)}
          onClick={() => select((page - 1 + pages.length) % pages.length, "previous")}
        >
          ←
        </button>
        <div aria-label="Choose a journal page">
          {pages.map((item, i) => (
            <button
              key={item.title}
              aria-label={`Page ${i + 1}: ${item.title}`}
              aria-pressed={page === i}
              disabled={Boolean(turn)}
              onClick={() => select(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          aria-label="Next page"
          disabled={Boolean(turn)}
          onClick={() => select((page + 1) % pages.length, "next")}
        >
          →
        </button>
      </div>
    </div>
  );
}

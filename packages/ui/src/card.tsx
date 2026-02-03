import { type JSX } from "react";

/**
 * Card component that renders a linked card with title and content.
 * @function Card
 * @param {string} className - Optional CSS class name for styling
 * @param {string} title - The title text to display in the card heading
 * @param {React.ReactNode} children - The content to display in the card body
 * @param {string} href - The URL to navigate to when card is clicked
 * @returns {JSX.Element} A link element styled as a card
 */
export function Card({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}): JSX.Element {
  return (
    <a
      className={className}
      href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo"`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <h2>
        {title} <span>-&gt;</span>
      </h2>
      <p>{children}</p>
    </a>
  );
}

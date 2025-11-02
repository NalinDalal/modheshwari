import { Button } from "@repo/ui/button";
import Image, { type ImageProps } from "next/image";

import styles from "./page.module.css";

type Props = Omit<ImageProps, "src"> & {
  srcLight: string;
  srcDark: string;
};

const ThemeImage =
  /**
   * Executes  theme image operation.
   * @param {Props} props - Description of props
   * @returns {React.JSX.Element} Description of return value
   */
  (props: Props) => {
    const { srcLight, srcDark, ...rest } = props;

    return (
      <>
        <Image {...rest} src={srcLight} className="imgLight" />
        <Image {...rest} src={srcDark} className="imgDark" />
      </>
    );
  };

/**
 * Auto-generated documentation for Home
 * @function Home
 * @param TODO: describe parameters
 * @returns TODO: describe return value
 */
export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ThemeImage
          className={styles.logo}
          srcLight="turborepo-dark.svg"
          srcDark="turborepo-light.svg"
          alt="Turborepo logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Get started by editing <code>apps/web/app/page.tsx</code>
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="/signup"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Signup
          </a>
          <a
            href="/signin"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Sign In
          </a>
        </div>
        <Button appName="web" className={styles.secondary}>
          Open alert
        </Button>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://vercel.com/templates?search=turborepo&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://turborepo.com?utm_source=create-turbo"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to turborepo.com →
        </a>
      </footer>
    </div>
  );
}

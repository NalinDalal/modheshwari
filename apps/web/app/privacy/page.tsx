/**
 * Performs  privacy operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function Privacy() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-sans text-black dark:text-white">
        Privacy Policy
      </h1>
      <p className="text-blue-700 dark-text-300 mb-6 hover:text-white-500">
        Last updated: 2025-11-09
      </p>
      <p className="text-gray-700 dark-text-gray-300 mb-6">
        Well sorta a document that describes that all of the things will be
        visible only to you , your family and higher lvel admins, not a single
        thing can be accessed to anyone else. Make sure to use strong passwords,
        make sure to discuss things out with your kins and peers before
        requesting them.
      </p>
      <strong>Do not share your passwords.</strong>
      <br />
    </div>
  );
}

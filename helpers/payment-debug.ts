/**
 * Debug helper to compare the generated signature with what PayFast might expect
 */
export function debugPayFastSignature(
  data: Record<string, string>,
  signature: string,
  passphrase: string,
): void {
  if (process.env.NODE_ENV !== "production") {
    console.log("\n--------- PAYFAST DEBUG INFO ---------");
    console.log("Data being sent to PayFast:");
    Object.keys(data)
      .sort()
      .forEach((key) => {
        console.log(`${key}: ${data[key]}`);
      });

    console.log("\nGenerated signature:", signature);

    // Build the signature string manually for visual inspection
    let manualString = "";
    Object.keys(data)
      .sort()
      .forEach((key) => {
        if (key !== "signature" && data[key] !== "") {
          manualString += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}&`;
        }
      });
    manualString = manualString.slice(0, -1); // Remove trailing &

    if (passphrase) {
      manualString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`;
    }

    console.log(
      "\nSignature string (without passphrase):",
      manualString.replace(/&passphrase=.*$/, "&passphrase=HIDDEN"),
    );

    // Generate a test signature with a completely manual approach
    const testSignature = crypto
      .createHash("md5")
      .update(manualString)
      .digest("hex");
    console.log("\nTest signature (manual string):", testSignature);

    if (signature !== testSignature) {
      console.log(
        "\n⚠️ WARNING: Test signature differs from generated signature!",
      );
      console.log(
        "This indicates an internal inconsistency in signature generation.",
      );
    }

    console.log("--------- END DEBUG INFO ---------\n");
  }
}

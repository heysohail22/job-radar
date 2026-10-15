const {
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");
module.exports = function withLocalApi(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application[0];
    application.$["android:networkSecurityConfig"] =
      "@xml/local_api_network_security";
    application.$["android:usesCleartextTraffic"] = "false";
    return mod;
  });
  return withDangerousMod(config, [
    "android",
    async (mod) => {
      const directory = path.join(
        mod.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(
        path.join(directory, "local_api_network_security.xml"),
        `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">127.0.0.1</domain>
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="false">::1</domain>
  </domain-config>
</network-security-config>
`,
      );
      return mod;
    },
  ]);
};

// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
const execFileAsync = promisify(execFile);
const strykerCli = join(dirname(fileURLToPath(import.meta.url)), stryMutAct_9fa48("1561") ? "" : (stryCov_9fa48("1561"), "../../node_modules/@stryker-mutator/core/bin/stryker.js"));
export type MutationOptions = {
  maxIterations: number;
  mutate?: string;
  target?: string;
};
export type MutationResult = {
  iteration: number;
  survivors: string[];
  report: string;
};
function parsePositiveInteger(value: string, flag: string): number {
  if (stryMutAct_9fa48("1562")) {
    {}
  } else {
    stryCov_9fa48("1562");
    const parsed = Number(value);
    if (stryMutAct_9fa48("1565") ? !Number.isInteger(parsed) && parsed < 1 : stryMutAct_9fa48("1564") ? false : stryMutAct_9fa48("1563") ? true : (stryCov_9fa48("1563", "1564", "1565"), (stryMutAct_9fa48("1566") ? Number.isInteger(parsed) : (stryCov_9fa48("1566"), !Number.isInteger(parsed))) || (stryMutAct_9fa48("1569") ? parsed >= 1 : stryMutAct_9fa48("1568") ? parsed <= 1 : stryMutAct_9fa48("1567") ? false : (stryCov_9fa48("1567", "1568", "1569"), parsed < 1)))) {
      if (stryMutAct_9fa48("1570")) {
        {}
      } else {
        stryCov_9fa48("1570");
        throw new Error(stryMutAct_9fa48("1571") ? `` : (stryCov_9fa48("1571"), `${flag} must be a positive integer`));
      }
    }
    return parsed;
  }
}
function applyMutationToken(token: string, next: string | undefined, options: MutationOptions): boolean {
  if (stryMutAct_9fa48("1572")) {
    {}
  } else {
    stryCov_9fa48("1572");
    if (stryMutAct_9fa48("1575") ? token === "--max-iterations" && token === "--maxIterations" : stryMutAct_9fa48("1574") ? false : stryMutAct_9fa48("1573") ? true : (stryCov_9fa48("1573", "1574", "1575"), (stryMutAct_9fa48("1577") ? token !== "--max-iterations" : stryMutAct_9fa48("1576") ? false : (stryCov_9fa48("1576", "1577"), token === (stryMutAct_9fa48("1578") ? "" : (stryCov_9fa48("1578"), "--max-iterations")))) || (stryMutAct_9fa48("1580") ? token !== "--maxIterations" : stryMutAct_9fa48("1579") ? false : (stryCov_9fa48("1579", "1580"), token === (stryMutAct_9fa48("1581") ? "" : (stryCov_9fa48("1581"), "--maxIterations")))))) {
      if (stryMutAct_9fa48("1582")) {
        {}
      } else {
        stryCov_9fa48("1582");
        if (stryMutAct_9fa48("1585") ? false : stryMutAct_9fa48("1584") ? true : stryMutAct_9fa48("1583") ? next : (stryCov_9fa48("1583", "1584", "1585"), !next)) throw new Error(stryMutAct_9fa48("1586") ? `` : (stryCov_9fa48("1586"), `${token} requires a value`));
        options.maxIterations = parsePositiveInteger(next, token);
        return stryMutAct_9fa48("1587") ? false : (stryCov_9fa48("1587"), true);
      }
    }
    if (stryMutAct_9fa48("1590") ? token.endsWith("--max-iterations=") : stryMutAct_9fa48("1589") ? false : stryMutAct_9fa48("1588") ? true : (stryCov_9fa48("1588", "1589", "1590"), token.startsWith(stryMutAct_9fa48("1591") ? "" : (stryCov_9fa48("1591"), "--max-iterations=")))) {
      if (stryMutAct_9fa48("1592")) {
        {}
      } else {
        stryCov_9fa48("1592");
        options.maxIterations = parsePositiveInteger(stryMutAct_9fa48("1593") ? token : (stryCov_9fa48("1593"), token.slice(17)), stryMutAct_9fa48("1594") ? "" : (stryCov_9fa48("1594"), "--max-iterations"));
        return stryMutAct_9fa48("1595") ? true : (stryCov_9fa48("1595"), false);
      }
    }
    if (stryMutAct_9fa48("1598") ? token === "--mutate" && token === "--target" : stryMutAct_9fa48("1597") ? false : stryMutAct_9fa48("1596") ? true : (stryCov_9fa48("1596", "1597", "1598"), (stryMutAct_9fa48("1600") ? token !== "--mutate" : stryMutAct_9fa48("1599") ? false : (stryCov_9fa48("1599", "1600"), token === (stryMutAct_9fa48("1601") ? "" : (stryCov_9fa48("1601"), "--mutate")))) || (stryMutAct_9fa48("1603") ? token !== "--target" : stryMutAct_9fa48("1602") ? false : (stryCov_9fa48("1602", "1603"), token === (stryMutAct_9fa48("1604") ? "" : (stryCov_9fa48("1604"), "--target")))))) {
      if (stryMutAct_9fa48("1605")) {
        {}
      } else {
        stryCov_9fa48("1605");
        if (stryMutAct_9fa48("1608") ? false : stryMutAct_9fa48("1607") ? true : stryMutAct_9fa48("1606") ? next : (stryCov_9fa48("1606", "1607", "1608"), !next)) throw new Error(stryMutAct_9fa48("1609") ? `` : (stryCov_9fa48("1609"), `${token} requires a value`));
        if (stryMutAct_9fa48("1612") ? token !== "--mutate" : stryMutAct_9fa48("1611") ? false : stryMutAct_9fa48("1610") ? true : (stryCov_9fa48("1610", "1611", "1612"), token === (stryMutAct_9fa48("1613") ? "" : (stryCov_9fa48("1613"), "--mutate")))) options.mutate = next;else options.target = next;
        return stryMutAct_9fa48("1614") ? false : (stryCov_9fa48("1614"), true);
      }
    }
    if (stryMutAct_9fa48("1617") ? token.endsWith("--mutate=") : stryMutAct_9fa48("1616") ? false : stryMutAct_9fa48("1615") ? true : (stryCov_9fa48("1615", "1616", "1617"), token.startsWith(stryMutAct_9fa48("1618") ? "" : (stryCov_9fa48("1618"), "--mutate=")))) {
      if (stryMutAct_9fa48("1619")) {
        {}
      } else {
        stryCov_9fa48("1619");
        options.mutate = stryMutAct_9fa48("1620") ? token : (stryCov_9fa48("1620"), token.slice(9));
        return stryMutAct_9fa48("1621") ? true : (stryCov_9fa48("1621"), false);
      }
    }
    if (stryMutAct_9fa48("1624") ? token.endsWith("--target=") : stryMutAct_9fa48("1623") ? false : stryMutAct_9fa48("1622") ? true : (stryCov_9fa48("1622", "1623", "1624"), token.startsWith(stryMutAct_9fa48("1625") ? "" : (stryCov_9fa48("1625"), "--target=")))) {
      if (stryMutAct_9fa48("1626")) {
        {}
      } else {
        stryCov_9fa48("1626");
        options.target = stryMutAct_9fa48("1627") ? token : (stryCov_9fa48("1627"), token.slice(9));
        return stryMutAct_9fa48("1628") ? true : (stryCov_9fa48("1628"), false);
      }
    }
    return stryMutAct_9fa48("1629") ? true : (stryCov_9fa48("1629"), false);
  }
}
export function parseMutationArgs(raw: string): MutationOptions {
  if (stryMutAct_9fa48("1630")) {
    {}
  } else {
    stryCov_9fa48("1630");
    const tokens = stryMutAct_9fa48("1632") ? raw.split(/\s+/).filter(Boolean) : stryMutAct_9fa48("1631") ? raw.trim().split(/\s+/) : (stryCov_9fa48("1631", "1632"), raw.trim().split(stryMutAct_9fa48("1634") ? /\S+/ : stryMutAct_9fa48("1633") ? /\s/ : (stryCov_9fa48("1633", "1634"), /\s+/)).filter(Boolean));
    const options: MutationOptions = stryMutAct_9fa48("1635") ? {} : (stryCov_9fa48("1635"), {
      maxIterations: 3
    });
    for (let index = 0; stryMutAct_9fa48("1638") ? index >= tokens.length : stryMutAct_9fa48("1637") ? index <= tokens.length : stryMutAct_9fa48("1636") ? false : (stryCov_9fa48("1636", "1637", "1638"), index < tokens.length); stryMutAct_9fa48("1639") ? index -= 1 : (stryCov_9fa48("1639"), index += 1)) {
      if (stryMutAct_9fa48("1640")) {
        {}
      } else {
        stryCov_9fa48("1640");
        const token = tokens[index];
        const consumesNext = applyMutationToken(token, tokens[stryMutAct_9fa48("1641") ? index - 1 : (stryCov_9fa48("1641"), index + 1)], options);
        if (stryMutAct_9fa48("1643") ? false : stryMutAct_9fa48("1642") ? true : (stryCov_9fa48("1642", "1643"), consumesNext)) {
          if (stryMutAct_9fa48("1644")) {
            {}
          } else {
            stryCov_9fa48("1644");
            stryMutAct_9fa48("1645") ? index -= 1 : (stryCov_9fa48("1645"), index += 1);
            continue;
          }
        }
        if (stryMutAct_9fa48("1648") ? (token.startsWith("--max-iterations=") || token.startsWith("--mutate=")) && token.startsWith("--target=") : stryMutAct_9fa48("1647") ? false : stryMutAct_9fa48("1646") ? true : (stryCov_9fa48("1646", "1647", "1648"), (stryMutAct_9fa48("1650") ? token.startsWith("--max-iterations=") && token.startsWith("--mutate=") : stryMutAct_9fa48("1649") ? false : (stryCov_9fa48("1649", "1650"), (stryMutAct_9fa48("1651") ? token.endsWith("--max-iterations=") : (stryCov_9fa48("1651"), token.startsWith(stryMutAct_9fa48("1652") ? "" : (stryCov_9fa48("1652"), "--max-iterations=")))) || (stryMutAct_9fa48("1653") ? token.endsWith("--mutate=") : (stryCov_9fa48("1653"), token.startsWith(stryMutAct_9fa48("1654") ? "" : (stryCov_9fa48("1654"), "--mutate=")))))) || (stryMutAct_9fa48("1655") ? token.endsWith("--target=") : (stryCov_9fa48("1655"), token.startsWith(stryMutAct_9fa48("1656") ? "" : (stryCov_9fa48("1656"), "--target=")))))) continue;
        if (stryMutAct_9fa48("1659") ? token.endsWith("-") : stryMutAct_9fa48("1658") ? false : stryMutAct_9fa48("1657") ? true : (stryCov_9fa48("1657", "1658", "1659"), token.startsWith(stryMutAct_9fa48("1660") ? "" : (stryCov_9fa48("1660"), "-")))) throw new Error(stryMutAct_9fa48("1661") ? `` : (stryCov_9fa48("1661"), `unknown mutation option: ${token}`));
        if (stryMutAct_9fa48("1664") ? false : stryMutAct_9fa48("1663") ? true : stryMutAct_9fa48("1662") ? options.target : (stryCov_9fa48("1662", "1663", "1664"), !options.target)) options.target = token;else throw new Error(stryMutAct_9fa48("1665") ? `` : (stryCov_9fa48("1665"), `unexpected mutation argument: ${token}`));
      }
    }
    return options;
  }
}
function survivorNames(value: unknown): string[] {
  if (stryMutAct_9fa48("1666")) {
    {}
  } else {
    stryCov_9fa48("1666");
    const names: string[] = stryMutAct_9fa48("1667") ? ["Stryker was here"] : (stryCov_9fa48("1667"), []);
    const visit = (node: unknown): void => {
      if (stryMutAct_9fa48("1668")) {
        {}
      } else {
        stryCov_9fa48("1668");
        if (stryMutAct_9fa48("1671") ? !node && typeof node !== "object" : stryMutAct_9fa48("1670") ? false : stryMutAct_9fa48("1669") ? true : (stryCov_9fa48("1669", "1670", "1671"), (stryMutAct_9fa48("1672") ? node : (stryCov_9fa48("1672"), !node)) || (stryMutAct_9fa48("1674") ? typeof node === "object" : stryMutAct_9fa48("1673") ? false : (stryCov_9fa48("1673", "1674"), typeof node !== (stryMutAct_9fa48("1675") ? "" : (stryCov_9fa48("1675"), "object")))))) return;
        if (stryMutAct_9fa48("1677") ? false : stryMutAct_9fa48("1676") ? true : (stryCov_9fa48("1676", "1677"), Array.isArray(node))) {
          if (stryMutAct_9fa48("1678")) {
            {}
          } else {
            stryCov_9fa48("1678");
            for (const item of node) visit(item);
            return;
          }
        }
        const record = node as Record<string, unknown>;
        const status = stryMutAct_9fa48("1679") ? String(record.status ?? record.mutantStatus ?? "").toUpperCase() : (stryCov_9fa48("1679"), String(stryMutAct_9fa48("1680") ? (record.status ?? record.mutantStatus) && "" : (stryCov_9fa48("1680"), (stryMutAct_9fa48("1681") ? record.status && record.mutantStatus : (stryCov_9fa48("1681"), record.status ?? record.mutantStatus)) ?? (stryMutAct_9fa48("1682") ? "Stryker was here!" : (stryCov_9fa48("1682"), "")))).toLowerCase());
        if (stryMutAct_9fa48("1685") ? status === "survived" && status === "survivor" : stryMutAct_9fa48("1684") ? false : stryMutAct_9fa48("1683") ? true : (stryCov_9fa48("1683", "1684", "1685"), (stryMutAct_9fa48("1687") ? status !== "survived" : stryMutAct_9fa48("1686") ? false : (stryCov_9fa48("1686", "1687"), status === (stryMutAct_9fa48("1688") ? "" : (stryCov_9fa48("1688"), "survived")))) || (stryMutAct_9fa48("1690") ? status !== "survivor" : stryMutAct_9fa48("1689") ? false : (stryCov_9fa48("1689", "1690"), status === (stryMutAct_9fa48("1691") ? "" : (stryCov_9fa48("1691"), "survivor")))))) {
          if (stryMutAct_9fa48("1692")) {
            {}
          } else {
            stryCov_9fa48("1692");
            const candidates = stryMutAct_9fa48("1693") ? [] : (stryCov_9fa48("1693"), [record.displayName, record.location, record.id, record.mutantId]);
            const name = candidates.find(stryMutAct_9fa48("1694") ? () => undefined : (stryCov_9fa48("1694"), (candidate): candidate is string | number => stryMutAct_9fa48("1697") ? typeof candidate === "string" && typeof candidate === "number" : stryMutAct_9fa48("1696") ? false : stryMutAct_9fa48("1695") ? true : (stryCov_9fa48("1695", "1696", "1697"), (stryMutAct_9fa48("1699") ? typeof candidate !== "string" : stryMutAct_9fa48("1698") ? false : (stryCov_9fa48("1698", "1699"), typeof candidate === (stryMutAct_9fa48("1700") ? "" : (stryCov_9fa48("1700"), "string")))) || (stryMutAct_9fa48("1702") ? typeof candidate !== "number" : stryMutAct_9fa48("1701") ? false : (stryCov_9fa48("1701", "1702"), typeof candidate === (stryMutAct_9fa48("1703") ? "" : (stryCov_9fa48("1703"), "number")))))));
            if (stryMutAct_9fa48("1706") ? name === undefined : stryMutAct_9fa48("1705") ? false : stryMutAct_9fa48("1704") ? true : (stryCov_9fa48("1704", "1705", "1706"), name !== undefined)) names.push(String(name));
          }
        }
        for (const child of Object.values(record)) visit(child);
      }
    };
    visit(value);
    return stryMutAct_9fa48("1707") ? [] : (stryCov_9fa48("1707"), [...new Set(names)]);
  }
}
export function parseMutationReport(source: string): string[] {
  if (stryMutAct_9fa48("1708")) {
    {}
  } else {
    stryCov_9fa48("1708");
    try {
      if (stryMutAct_9fa48("1709")) {
        {}
      } else {
        stryCov_9fa48("1709");
        return survivorNames(JSON.parse(source));
      }
    } catch {
      if (stryMutAct_9fa48("1710")) {
        {}
      } else {
        stryCov_9fa48("1710");
        return stryMutAct_9fa48("1711") ? ["Stryker was here"] : (stryCov_9fa48("1711"), []);
      }
    }
  }
}
export async function runMutationTesting(cwd: string, options: MutationOptions, iteration: number): Promise<MutationResult> {
  if (stryMutAct_9fa48("1712")) {
    {}
  } else {
    stryCov_9fa48("1712");
    const tempDir = await mkdtemp(join(tmpdir(), stryMutAct_9fa48("1713") ? "" : (stryCov_9fa48("1713"), "pi-mutation-")));
    const reportPath = join(tempDir, stryMutAct_9fa48("1714") ? "" : (stryCov_9fa48("1714"), "mutation.json"));
    const configPath = join(tempDir, stryMutAct_9fa48("1715") ? "" : (stryCov_9fa48("1715"), "stryker.config.mjs"));
    const mutatePattern = stryMutAct_9fa48("1716") ? options.mutate && options.target : (stryCov_9fa48("1716"), options.mutate ?? options.target);
    const mutate = mutatePattern ? stryMutAct_9fa48("1717") ? `` : (stryCov_9fa48("1717"), `mutate: [${JSON.stringify(mutatePattern)}],`) : stryMutAct_9fa48("1718") ? "Stryker was here!" : (stryCov_9fa48("1718"), "");
    // The repository's executable tests use Node's built-in test runner. Using
    // Stryker's Vitest runner here reports "no tests" even though the suite
    // passes, because `.test.mjs` files are not Vitest suites. Run the same
    // hermetic command used by CI so each Stryker sandbox builds its own
    // mutated sources before executing the integration tests.
    const target = stryMutAct_9fa48("1719") ? "" : (stryCov_9fa48("1719"), 'testRunner: "command", commandRunner: { command: "node node_modules/typescript/bin/tsc -p tsconfig.json && node --test test/*.test.mjs" },');
    // Forge already runs the command in an isolated worker workspace. Keeping
    // Stryker in-place avoids a second sandbox whose Git metadata points back to
    // the host checkout and breaks workspace-sensitive integration tests.
    const config = stryMutAct_9fa48("1720") ? `` : (stryCov_9fa48("1720"), `export default { ${target} ${mutate} inPlace: true, reporters: ["json"], jsonReporter: { fileName: ${JSON.stringify(reportPath)} } };\n`);
    await writeFile(configPath, config, stryMutAct_9fa48("1721") ? "" : (stryCov_9fa48("1721"), "utf8"));
    try {
      if (stryMutAct_9fa48("1722")) {
        {}
      } else {
        stryCov_9fa48("1722");
        try {
          if (stryMutAct_9fa48("1723")) {
            {}
          } else {
            stryCov_9fa48("1723");
            await execFileAsync(process.execPath, stryMutAct_9fa48("1724") ? [] : (stryCov_9fa48("1724"), [strykerCli, stryMutAct_9fa48("1725") ? "" : (stryCov_9fa48("1725"), "run"), configPath]), stryMutAct_9fa48("1726") ? {} : (stryCov_9fa48("1726"), {
              cwd,
              timeout: stryMutAct_9fa48("1727") ? 30 * 60 / 1000 : (stryCov_9fa48("1727"), (stryMutAct_9fa48("1728") ? 30 / 60 : (stryCov_9fa48("1728"), 30 * 60)) * 1000),
              maxBuffer: stryMutAct_9fa48("1729") ? 20 * 1024 / 1024 : (stryCov_9fa48("1729"), (stryMutAct_9fa48("1730") ? 20 / 1024 : (stryCov_9fa48("1730"), 20 * 1024)) * 1024)
            }));
          }
        } catch (error) {
          if (stryMutAct_9fa48("1731")) {
            {}
          } else {
            stryCov_9fa48("1731");
            // Stryker exits non-zero when the mutation score is below its threshold.
            // A report is still actionable evidence for the repair loop.
            try {
              if (stryMutAct_9fa48("1732")) {
                {}
              } else {
                stryCov_9fa48("1732");
                const report = await readFile(reportPath, stryMutAct_9fa48("1733") ? "" : (stryCov_9fa48("1733"), "utf8"));
                return stryMutAct_9fa48("1734") ? {} : (stryCov_9fa48("1734"), {
                  iteration,
                  survivors: parseMutationReport(report),
                  report
                });
              }
            } catch {
              if (stryMutAct_9fa48("1735")) {
                {}
              } else {
                stryCov_9fa48("1735");
                throw error;
              }
            }
          }
        }
        const report = await readFile(reportPath, stryMutAct_9fa48("1736") ? "" : (stryCov_9fa48("1736"), "utf8"));
        return stryMutAct_9fa48("1737") ? {} : (stryCov_9fa48("1737"), {
          iteration,
          survivors: parseMutationReport(report),
          report
        });
      }
    } finally {
      if (stryMutAct_9fa48("1738")) {
        {}
      } else {
        stryCov_9fa48("1738");
        await rm(tempDir, stryMutAct_9fa48("1739") ? {} : (stryCov_9fa48("1739"), {
          recursive: stryMutAct_9fa48("1740") ? false : (stryCov_9fa48("1740"), true),
          force: stryMutAct_9fa48("1741") ? false : (stryCov_9fa48("1741"), true)
        }));
      }
    }
  }
}
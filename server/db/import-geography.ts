import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  GeoLocation,
  GeographyDatasetMetadata,
  GeographyDatasetSource,
} from "../../shared/contracts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RawGeographyDatasetFile {
  metadata: {
    title: string;
    version: string;
    sources: GeographyDatasetSource[];
    coverageNote: string;
  };
  unionTerritoriesAndExtraStates: GeoLocation[];
  maharashtraDistricts: GeoLocation[];
  nationalExtraDistricts: GeoLocation[];
  subdistrictsAndTalukas: GeoLocation[];
  extraTownsAndVillages: GeoLocation[];
}

export function resolveGeographyDataPath(): string {
  const candidates = [
    path.resolve(
      process.cwd(),
      "server",
      "db",
      "data",
      "india-administrative-geography.json"
    ),
    path.resolve(
      process.cwd(),
      "..",
      "server",
      "db",
      "data",
      "india-administrative-geography.json"
    ),
    path.resolve(__dirname, "data", "india-administrative-geography.json"),
    path.resolve(
      __dirname,
      "..",
      "server",
      "db",
      "data",
      "india-administrative-geography.json"
    ),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return candidates[0];
}

export function loadAdministrativeGeographyDataset(): {
  metadata: RawGeographyDatasetFile["metadata"];
  extraLocations: GeoLocation[];
} {
  const filePath = resolveGeographyDataPath();
  if (!fs.existsSync(filePath)) {
    return {
      metadata: {
        title: "Bharat CultureMap — Administrative Geography Directory of India",
        version: "2026.1",
        sources: [],
        coverageNote: "Fallback minimal geography loaded.",
      },
      extraLocations: [],
    };
  }
  const raw = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  ) as RawGeographyDatasetFile;

  const extraLocations: GeoLocation[] = [
    ...(raw.unionTerritoriesAndExtraStates || []),
    ...(raw.maharashtraDistricts || []),
    ...(raw.nationalExtraDistricts || []),
    ...(raw.subdistrictsAndTalukas || []),
    ...(raw.extraTownsAndVillages || []),
  ];

  return {
    metadata: raw.metadata,
    extraLocations,
  };
}

export function buildGeographyDatasetMetadata(
  allLocations: GeoLocation[],
  placesWithRecordsCount: number
): GeographyDatasetMetadata {
  const { metadata } = loadAdministrativeGeographyDataset();
  const countries = allLocations.filter((l) => l.level === "COUNTRY").length;
  const statesAndUts = allLocations.filter((l) => l.level === "STATE").length;
  const districts = allLocations.filter((l) => l.level === "DISTRICT").length;
  const subdistrictsAndTalukas = allLocations.filter(
    (l) => l.level === "TALUKA"
  ).length;
  const citiesTownsAndVillages = allLocations.filter(
    (l) => l.level === "CITY_TOWN" || l.level === "VILLAGE"
  ).length;
  const totalPlaces = allLocations.length;

  return {
    title: metadata.title,
    version: metadata.version,
    sources: metadata.sources,
    coverageNote: metadata.coverageNote,
    counts: {
      countries,
      statesAndUts,
      districts,
      subdistrictsAndTalukas,
      citiesTownsAndVillages,
      totalPlaces,
      placesWithCulturalRecords: placesWithRecordsCount,
      placesCollectionInProgress: Math.max(
        0,
        totalPlaces - placesWithRecordsCount
      ),
    },
  };
}

// CLI execution when invoked via `pnpm run db:import-geography` (`tsx server/db/import-geography.ts`)
const isCliExecution =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv.some((arg) => arg.includes("import-geography"));

if (isCliExecution) {
  import("./repository").then(({ getRepository }) => {
    const repo = getRepository();
    const meta = repo.getGeographyMetadata();
    console.log(
      `[db:import-geography] Geography directory verified in '${repo.driverName}' (${repo.dbPath}).`
    );
    console.log(
      `[db:import-geography] Dataset: ${meta.title} (v${meta.version})`
    );
    console.log(
      `[db:import-geography] Hierarchy counts — Countries: ${meta.counts.countries} | States/UTs: ${meta.counts.statesAndUts} | Districts: ${meta.counts.districts} | Subdistricts/Talukas: ${meta.counts.subdistrictsAndTalukas} | Cities/Towns/Villages: ${meta.counts.citiesTownsAndVillages} | Total Places: ${meta.counts.totalPlaces}`
    );
    repo.close();
  });
}

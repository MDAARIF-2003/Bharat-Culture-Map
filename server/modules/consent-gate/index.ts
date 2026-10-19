import {
  CONSERVATIVE_PASSPORT_DEFAULTS,
  RecordOrigin,
} from "../../../shared/const";
import {
  CulturalRecordAdmin,
  CulturalRightsPassport,
  GeoLocation,
  PublicCulturalRecord,
} from "../../../shared/contracts";

export class ConsentGateError extends Error {
  public readonly statusCode = 403;
  public readonly reasons: string[];

  constructor(reasons: string[]) {
    super(
      `Publication blocked by Cultural Rights Passport gate: ${reasons.join(" ")}`
    );
    this.name = "ConsentGateError";
    this.reasons = reasons;
  }
}

export function createDefaultRightsPassport(
  id: string,
  culturalRecordId: string,
  origin: RecordOrigin = "FIELD_VERIFIED"
): CulturalRightsPassport {
  const now = new Date().toISOString();
  const isDemo = origin === "DEMO_REFERENCE";
  return {
    id,
    culturalRecordId,
    version: 1,
    consentTakingPart: isDemo,
    consentBeingRecorded: isDemo,
    consentPublicUse: isDemo,
    consentMode: isDemo ? "DEMO_PLACEHOLDER" : "WRITTEN_SIGNED",
    witnessNamePrivate: null,
    consentSignedAt: isDemo ? now : null,
    statements: {
      voluntaryParticipation: isDemo,
      rightToWithdraw: isDemo,
      interviewAndRecording: isDemo,
      nothingPublicWithoutApproval: isDemo,
      sacredPrivateExcluded: isDemo,
      noExternalAiOrVoiceCloning: isDemo,
      fairCompensationIndependentOfConsent: isDemo,
    },
    identityDisplay: CONSERVATIVE_PASSPORT_DEFAULTS.identityDisplay,
    locationGranularity: CONSERVATIVE_PASSPORT_DEFAULTS.locationGranularity,
    audioVideoAccess: CONSERVATIVE_PASSPORT_DEFAULTS.audioVideoAccess,
    translationScope: isDemo
      ? "SELECTED_LANGUAGES"
      : CONSERVATIVE_PASSPORT_DEFAULTS.translationScope,
    allowedTranslationLanguages: isDemo ? ["en", "mr"] : [],
    aiUse: CONSERVATIVE_PASSPORT_DEFAULTS.aiUse,
    downloadReuse: isDemo
      ? "EDUCATIONAL_ONLY"
      : CONSERVATIVE_PASSPORT_DEFAULTS.downloadReuse,
    commercialUse: CONSERVATIVE_PASSPORT_DEFAULTS.commercialUse,
    contactMode: CONSERVATIVE_PASSPORT_DEFAULTS.contactMode,
    withdrawalStatus: CONSERVATIVE_PASSPORT_DEFAULTS.withdrawalStatus,
    practitionerConfirmedAt: null,
    preReleaseReconfirmedAt: null,
    updatedAt: now,
  };
}

export interface PublicationGateResult {
  allowed: boolean;
  reasons: string[];
}

/**
 * Evaluates whether a cultural record meets all ethical, consent, review,
 * and provenance requirements to be published or displayed publicly.
 */
export function evaluatePublicationGate(
  record: CulturalRecordAdmin
): PublicationGateResult {
  const reasons: string[] = [];
  const passport = record.rightsPassport;

  if (!passport) {
    return {
      allowed: false,
      reasons: ["Missing Cultural Rights Passport for this record."],
    };
  }

  // 1. Sacred or restricted content is never published or indexed (Section 5)
  if (record.isSacredOrRestricted) {
    reasons.push(
      "Record contains content marked sacred or restricted by a practitioner or elder and cannot be published."
    );
  }

  // 2. Withdrawal or restriction check
  if (
    passport.withdrawalStatus === "RESTRICTED" ||
    passport.withdrawalStatus === "REMOVED"
  ) {
    reasons.push(
      `Rights Passport withdrawal status is '${passport.withdrawalStatus}'. Record is blocked from public view.`
    );
  }

  if (record.status === "RESTRICTED" || record.status === "WITHDRAWN") {
    reasons.push(
      `Record status is '${record.status}'. Public release is disabled.`
    );
  }

  // 3. Demonstration reference records vs Field-Verified records
  if (record.recordOrigin === "DEMO_REFERENCE") {
    if (passport.consentMode !== "DEMO_PLACEHOLDER") {
      reasons.push(
        "Demonstration records must use consentMode='DEMO_PLACEHOLDER' and never claim signed field consent."
      );
    }
    return {
      allowed: reasons.length === 0,
      reasons,
    };
  }

  // 4. Strict requirements for FIELD_VERIFIED records (HLFA Sections 5, 6.1, 6.5)
  if (passport.consentMode === "DEMO_PLACEHOLDER") {
    reasons.push(
      "Field-verified records cannot use a demonstration consent placeholder."
    );
  }

  if (
    !passport.consentTakingPart ||
    !passport.consentBeingRecorded ||
    !passport.consentPublicUse
  ) {
    reasons.push(
      "Three-part informed consent (taking part, being recorded, and public use) must all be granted before publication."
    );
  }

  if (
    passport.consentMode === "WITNESSED_VERBAL" &&
    (!passport.witnessNamePrivate || !passport.witnessNamePrivate.trim())
  ) {
    reasons.push(
      "Witnessed verbal consent requires recording the witness name in the private consent record."
    );
  }

  const st = passport.statements;
  if (
    !st ||
    !st.voluntaryParticipation ||
    !st.rightToWithdraw ||
    !st.interviewAndRecording ||
    !st.nothingPublicWithoutApproval ||
    !st.sacredPrivateExcluded ||
    !st.noExternalAiOrVoiceCloning ||
    !st.fairCompensationIndependentOfConsent
  ) {
    reasons.push(
      "All 7 Part-B informed consent statements (Instrument 6.1) must be initialed/confirmed before publication."
    );
  }

  if (!passport.practitionerConfirmedAt || !passport.preReleaseReconfirmedAt) {
    reasons.push(
      "Sustained consent requires both initial practitioner confirmation and pre-release re-confirmation timestamps."
    );
  }

  // 5. Provenance chain verification (Instrument 6.5)
  const logs = record.provenanceLogs || [];
  const hasCollected = logs.some((l) => l.stepType === "COLLECTED");
  const hasConsented = logs.some(
    (l) => l.stepType === "CONSENTED" && l.practitionerApproved
  );
  const hasReview = logs.some(
    (l) =>
      (l.stepType === "TRANSCRIBED" ||
        l.stepType === "TRANSLATED" ||
        l.stepType === "NARRATED") &&
      ["LANGUAGE_REVIEWER", "FOLKLORE_REVIEWER", "SUPER_ADMIN"].includes(
        l.performedByRole
      )
  );
  const hasPractitionerApproval = logs.some(
    (l) =>
      l.stepType === "APPROVED" &&
      l.practitionerApproved &&
      ["PRACTITIONER_APPROVER", "SUPER_ADMIN"].includes(l.performedByRole)
  );

  if (!hasCollected) {
    reasons.push(
      "Provenance chain is missing the 'COLLECTED' field documentation step."
    );
  }
  if (!hasConsented) {
    reasons.push(
      "Provenance chain is missing a practitioner-confirmed 'CONSENTED' step."
    );
  }
  if (!hasReview) {
    reasons.push(
      "Provenance chain is missing an authorized review step ('TRANSCRIBED', 'TRANSLATED', or 'NARRATED') by a Language or Folklore Reviewer."
    );
  }
  if (!hasPractitionerApproval) {
    reasons.push(
      "Provenance chain is missing final practitioner approval ('APPROVED') verified by a Practitioner Approver."
    );
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

export interface LocationContext {
  state?: GeoLocation | null;
  district?: GeoLocation | null;
  taluka?: GeoLocation | null;
  cityTown?: GeoLocation | null;
}

/**
 * Serializes an internal CulturalRecordAdmin into a public-safe record,
 * enforcing Rights Passport privacy, attribution, location granularity,
 * audio/video permissions, and translation boundaries.
 *
 * CRITICAL LOCATION PRIVACY RULE:
 * - HIDDEN: exposes only stateName; districtName = null, cityTownName = null, publicCenter = null.
 * - DISTRICT: exposes districtName + stateName and district centroid ONLY; cityTownName is masked (null)
 *   for field-verified records and exactLatPrivate/exactLngPrivate/practitionerVillagePrivate are NEVER exposed.
 * - TALUKA: exposes taluka + district + state and city/town or district centroid; never exact workshop coordinates.
 * - VILLAGE: exposes village + taluka + district + state and city/town or district centroid; never exact workshop coordinates.
 * - EXACT_WORKSHOP: uses exactLatPrivate/exactLngPrivate if provided (or cityTown centroid), while still masking street address & phone.
 */
export function toPublicCulturalRecord(
  record: CulturalRecordAdmin,
  loc: LocationContext
): PublicCulturalRecord {
  const passport = record.rightsPassport;
  const isDemo = record.recordOrigin === "DEMO_REFERENCE";

  // 1. Identity display masking
  let creditedPractitionerLabel = "Practitioner (Chosen Name)";
  if (isDemo) {
    const rawChosen = (record.practitionerChosenName || "").trim();
    creditedPractitionerLabel =
      rawChosen && !rawChosen.toLowerCase().includes("prototype")
        ? rawChosen
        : "Community verification pending";
  } else {
    switch (passport.identityDisplay) {
      case "FULL_NAME":
        creditedPractitionerLabel =
          record.practitionerFullNamePrivate ||
          record.practitionerChosenName ||
          "Named Practitioner";
        break;
      case "CHOSEN_NAME":
        creditedPractitionerLabel =
          record.practitionerChosenName || "Practitioner (Chosen Name)";
        break;
      case "COMMUNITY_NAME":
        creditedPractitionerLabel =
          record.practitionerCommunityName || "Community Tradition Bearer";
        break;
      case "ANONYMOUS":
        creditedPractitionerLabel =
          "Anonymous Practitioner (Identity Protected by Rights Passport)";
        break;
    }
  }

  const communityLabel = isDemo
    ? record.practitionerCommunityName &&
      !record.practitionerCommunityName.toLowerCase().includes("to be identified")
      ? record.practitionerCommunityName
      : "Regional tradition bearers (verification in progress)"
    : record.practitionerCommunityName || "Community-governed tradition";

  // 2. Location granularity masking (never expose street address, phone, or unpermitted coordinates)
  const stateName = loc.state?.nameEn || "Maharashtra";
  const rawDistrictName = loc.district?.nameEn || null;
  const rawCityTownName = loc.cityTown?.nameEn || null;

  let exposedDistrictName: string | null = rawDistrictName;
  let exposedCityTownName: string | null = rawCityTownName;
  let displayLocationLabel = stateName;
  let publicCenter: { lat: number; lng: number } | null = null;

  const districtCenter = loc.district
    ? { lat: loc.district.centerLat, lng: loc.district.centerLng }
    : null;
  const cityCenter = loc.cityTown
    ? { lat: loc.cityTown.centerLat, lng: loc.cityTown.centerLng }
    : null;
  const stateCenter = loc.state
    ? { lat: loc.state.centerLat, lng: loc.state.centerLng }
    : null;

  switch (passport.locationGranularity) {
    case "HIDDEN":
      exposedDistrictName = null;
      exposedCityTownName = null;
      displayLocationLabel = `${stateName} (Exact Location Hidden by Rights Passport)`;
      publicCenter = null;
      break;
    case "DISTRICT":
      exposedDistrictName = rawDistrictName;
      // For FIELD_VERIFIED records with DISTRICT granularity, mask the specific city/town/village
      // so only the district level is exposed. (Demo reference seeds retain city grouping for national map demo browsing.)
      exposedCityTownName = isDemo ? rawCityTownName : null;
      displayLocationLabel = rawDistrictName
        ? `${rawDistrictName}, ${stateName}`
        : rawCityTownName
          ? `${rawCityTownName}, ${stateName}`
          : stateName;
      publicCenter = districtCenter || cityCenter || stateCenter;
      break;
    case "TALUKA":
      exposedDistrictName = rawDistrictName;
      exposedCityTownName = rawCityTownName;
      displayLocationLabel = [
        record.practitionerTaluka,
        rawDistrictName || rawCityTownName,
        stateName,
      ]
        .filter(Boolean)
        .join(", ");
      publicCenter = cityCenter || districtCenter || stateCenter;
      break;
    case "CITY_TOWN":
    case "VILLAGE":
      exposedDistrictName = rawDistrictName;
      exposedCityTownName = rawCityTownName;
      displayLocationLabel = [
        record.practitionerVillagePrivate || rawCityTownName,
        record.practitionerTaluka,
        rawDistrictName,
        stateName,
      ]
        .filter(Boolean)
        .join(", ");
      publicCenter = cityCenter || districtCenter || stateCenter;
      break;
    case "EXACT_WORKSHOP":
      exposedDistrictName = rawDistrictName;
      exposedCityTownName = rawCityTownName;
      displayLocationLabel = [
        record.practitionerVillagePrivate || rawCityTownName,
        record.practitionerTaluka,
        rawDistrictName,
        stateName,
      ]
        .filter(Boolean)
        .join(", ");
      if (
        record.exactLatPrivate !== null &&
        record.exactLatPrivate !== undefined &&
        record.exactLngPrivate !== null &&
        record.exactLngPrivate !== undefined
      ) {
        publicCenter = {
          lat: Number(record.exactLatPrivate),
          lng: Number(record.exactLngPrivate),
        };
      } else {
        publicCenter = cityCenter || districtCenter || stateCenter;
      }
      break;
  }

  // 3. Audio/video permission enforcement
  const canPlayAudioVideo =
    passport.audioVideoAccess === "PUBLIC" ||
    passport.audioVideoAccess === "LIMITED";

  // 4. Translation scope enforcement
  const translationPermitted =
    passport.translationScope === "SELECTED_LANGUAGES";

  return {
    id: record.id,
    slug: record.slug,
    traditionId: record.traditionId || null,
    traditionSlug: record.traditionSlug || null,
    recordOrigin: record.recordOrigin,
    originBadgeLabel: isDemo
      ? "REFERENCE INFORMATION · COMMUNITY VERIFICATION PENDING"
      : "PRACTITIONER-APPROVED · FIELD-VERIFIED",
    verificationStateLabel: isDemo
      ? "Reference information"
      : "Practitioner-approved",
    sourceAttribution:
      record.sourceAttribution ||
      (isDemo
        ? "Ministry of Culture Cultural Atlas & State Gazetteer Reference"
        : null),
    sourceUrl: record.sourceUrl || null,
    unescoDomain: record.unescoDomain,
    category: record.category,
    isWomenLed: record.isWomenLed,
    titleEn: record.titleEn,
    titleMr: record.titleMr,
    subtitleEn: record.subtitleEn,
    summaryEn: record.summaryEn,
    summaryMr: record.summaryMr,
    practiceContextEn: record.practiceContextEn,
    practiceContextMr: record.practiceContextMr,
    tags: record.tags,
    heroImageUrl: record.heroImageUrl,
    creditedPractitionerLabel,
    communityLabel,
    displayLocationLabel,
    locationGranularity: passport.locationGranularity,
    stateName,
    districtName: exposedDistrictName,
    talukaName:
      passport.locationGranularity === "HIDDEN"
        ? null
        : loc.taluka?.nameEn || record.practitionerTaluka || null,
    cityTownName: exposedCityTownName,
    publicCenter,
    originalVoiceLanguage: record.originalVoiceLanguage,
    canPlayAudioVideo,
    originalVoiceAudioUrl: canPlayAudioVideo
      ? record.originalVoiceAudioUrl || null
      : null,
    originalVoiceTranscriptMr: record.originalVoiceTranscriptMr || null,
    translationPermitted,
    mediationM1SubtitlesEn: translationPermitted
      ? record.mediationM1SubtitlesEn || null
      : null,
    mediationM2SyntheticContextText: translationPermitted
      ? record.mediationM2SyntheticContextText || null
      : null,
    mediationM3HumanStoryCompanionText: translationPermitted
      ? record.mediationM3HumanStoryCompanionText || null
      : null,
    mediationM3NarratorCredit: translationPermitted
      ? record.mediationM3NarratorCredit || null
      : null,
    storyCompanionPrompts: record.storyCompanionPrompts || [],
    vocabulary: record.vocabulary || [],
    publicRightsCard: {
      version: passport.version,
      recordOrigin: record.recordOrigin,
      identityDisplay: passport.identityDisplay,
      locationGranularity: passport.locationGranularity,
      audioVideoAccess: passport.audioVideoAccess,
      translationScope: passport.translationScope,
      aiUse: passport.aiUse,
      downloadReuse: passport.downloadReuse,
      commercialUse: passport.commercialUse,
      contactMode: passport.contactMode,
      withdrawalStatus: passport.withdrawalStatus,
      practitionerApproved: Boolean(passport.practitionerConfirmedAt),
      preReleaseReconfirmed: Boolean(passport.preReleaseReconfirmedAt),
    },
    provenanceChain: (record.provenanceLogs || []).map((log) => ({
      stepType: log.stepType,
      performedByRole: log.performedByRole,
      practitionerApproved: log.practitionerApproved,
      versionLabel: log.versionLabel,
      notes: log.notes,
      createdAt: log.createdAt,
    })),
    publishedAt: record.publishedAt,
  };
}

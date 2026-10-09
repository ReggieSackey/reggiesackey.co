import { PROFILE_DOCUMENTS } from "../../convex/seedData";

const profile = PROFILE_DOCUMENTS.find((document) => document.type === "how-i-work");

export const howIWorkFallback = profile
  ? {
      document: { title: profile.title },
      sections: profile.sections.map((section) => ({ ...section, _id: section.slug })),
    }
  : undefined;

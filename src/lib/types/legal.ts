// Shape of a legal document page (see src/lib/server/legal.ts)
export interface LegalSection {
  id: string;
  title: string;
  html: string;
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  description: string;
  introHtml: string;
  sections: LegalSection[];
}

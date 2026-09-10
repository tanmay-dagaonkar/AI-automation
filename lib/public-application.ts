import type { WithId } from "mongodb";
import type { ApplicationDocument } from "./mongodb";
import type { PublicApplication } from "./types";
export function publicApplication(document: WithId<ApplicationDocument>, owner = false): PublicApplication { return { id: document._id.toHexString(), applicantName: document.applicantName, ...(owner ? { applicantEmail: document.applicantEmail } : {}), jobUrl: document.jobUrl, fileName: document.fileName, status: document.status, createdAt: document.createdAt.toISOString(), updatedAt: document.updatedAt.toISOString(), ...(document.result ? { result: document.result } : {}), ...(document.error ? { error: document.error } : {}) }; }

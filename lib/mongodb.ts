import { Collection, Db, GridFSBucket, MongoClient, ObjectId } from "mongodb";
import type { ApplicationResult, ApplicationStatus } from "./types";

export type ApplicationDocument = { applicantName: string; applicantEmail: string; jobUrl: string; fallbackJobDescription?: string; fileId: ObjectId; fileName: string; mimeType: string; fileSize: number; resumeText: string; trackingTokenHash: string; status: ApplicationStatus; result?: ApplicationResult; error?: string; notifiedAt?: Date; createdAt: Date; updatedAt: Date };
const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "rolepilot";
declare global { var rolepilotMongoPromise: Promise<MongoClient> | undefined; }
function clientPromise() { if (!uri) throw new Error("MONGODB_URI is not configured."); if (!global.rolepilotMongoPromise) global.rolepilotMongoPromise = new MongoClient(uri).connect(); return global.rolepilotMongoPromise; }
export async function database(): Promise<Db> { return (await clientPromise()).db(databaseName); }
export async function applications(): Promise<Collection<ApplicationDocument>> { return (await database()).collection<ApplicationDocument>("applications"); }
export async function resumeBucket(): Promise<GridFSBucket> { return new GridFSBucket(await database(), { bucketName: "resumes" }); }

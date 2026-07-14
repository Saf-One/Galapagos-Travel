// NextAuth (Auth.js v5) catch-all route handler.
// This file is REQUIRED for NextAuth to work: it exposes the
// GET/POST endpoints at /api/auth/* (signin, callback, signout, session...).
import {handlers} from "@/lib/auth";

export const {GET, POST} = handlers;

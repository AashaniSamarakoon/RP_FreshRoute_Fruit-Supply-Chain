/**
 * Proposal notification handler — watches match_proposals for new matches,
 * acceptances, rejections, expirations, and cancellations.
 *
 * To add new statuses: extend FARMER_MAP or BUYER_MAP below.
 * No other files need to change.
 */
import { notificationRegistry } from "../registry";
import {
    NotificationEvent,
    NotificationHandler,
    Role,
    ToastContent,
} from "../types";

// ─── Message maps ─────────────────────────────────────────────────────────────

const FARMER_MAP: Record<string, ToastContent> = {
    PENDING_FARMER: {
        title: "New Match!",
        message: "A buyer wants your harvest — review to accept or decline",
        preset: "done",
        viewRoute: "/farmer/(tabs)/orders",
        viewLabel: "Review",
    },
    ACCEPTED: {
        title: "Deal Confirmed",
        message: "Your proposal is now active",
        preset: "done",
        viewRoute: "/farmer/(tabs)/orders",
        viewLabel: "View",
    },
    REJECTED: {
        title: "Proposal Declined",
        message: "This match wasn't accepted",
        preset: "error",
    },
    EXPIRED: {
        title: "Proposal Expired",
        message: "A pending match has expired",
        preset: "error",
    },
    CANCELLED: {
        title: "Proposal Cancelled",
        message: "A buyer cancelled this match",
        preset: "error",
    },
};

const BUYER_MAP: Record<string, ToastContent> = {
    PENDING_BUYER: {
        title: "Farmer Found!",
        message: "A farmer matched your order — review now",
        preset: "done",
        viewRoute: "/buyer/(tabs)/orders",
        viewLabel: "Review",
    },
    ACCEPTED: {
        title: "Match Accepted",
        message: "A farmer accepted your order",
        preset: "done",
        viewRoute: "/buyer/(tabs)/orders",
        viewLabel: "View",
    },
    REJECTED: {
        title: "Match Declined",
        message: "We'll find another farmer for you",
        preset: "error",
    },
    EXPIRED: {
        title: "Match Expired",
        message: "A proposal expired — a new match will be attempted",
        preset: "error",
    },
    CANCELLED: {
        title: "Match Cancelled",
        message: "This match was cancelled",
        preset: "error",
    },
};

const ROLE_MAP: Record<Role, Record<string, ToastContent>> = {
    farmer: FARMER_MAP,
    buyer: BUYER_MAP,
};

// ─── Handler ──────────────────────────────────────────────────────────────────

const proposalHandler: NotificationHandler = {
    id: "proposal-changes",
    channelName: "match:proposals",
    table: "match_proposals",
    events: ["INSERT", "UPDATE"],

    resolve(role: Role, event: NotificationEvent): ToastContent | null {
        const status = event.record.status as string | undefined;
        if (!status) return null;
        return ROLE_MAP[role][status] ?? null;
    },
};

// Self-register — importing this file is the only requirement
notificationRegistry.register(proposalHandler);

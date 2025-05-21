"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZohoAuthService = void 0;
const utils_1 = require("../utils");
class ZohoAuthService {
    constructor(catalystApp) {
        const datastore = catalystApp.datastore();
        this.table = datastore.table('OAuthTokens');
        this.config = (0, utils_1.getZohoAuthConfig)();
    }
    /**
     * Exchange authorization code for tokens and store them
     */
    storeTokensFromCode(code, userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokens = yield (0, utils_1.exchangeCodeForTokens)(code, this.config);
                yield this.storeTokens(userIdentifier, tokens);
                return tokens;
            }
            catch (error) {
                console.error('Error storing tokens from code:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to store tokens: ${errorMessage}`);
            }
        });
    }
    /**
     * Store tokens in Catalyst Data Store
     */
    storeTokens(userIdentifier, tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all rows and filter for the user
                const allRows = yield this.table.getAllRows();
                const existingRow = allRows.find((row) => row.userIdentifier === userIdentifier);
                if (existingRow) {
                    // Update existing record
                    yield this.table.updateRow({
                        ROWID: existingRow.ROWID, // Use ROWID for updating
                        userIdentifier,
                        tokens: JSON.stringify(tokens)
                    });
                }
                else {
                    // Insert new record
                    yield this.table.insertRow({
                        userIdentifier,
                        tokens: JSON.stringify(tokens)
                    });
                }
            }
            catch (error) {
                console.error('Error storing tokens:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to store tokens: ${errorMessage}`);
            }
        });
    }
    /**
     * Get tokens for a specific user
     */
    getTokens(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all rows and filter
                const allRows = yield this.table.getAllRows();
                const userRow = allRows.find((row) => row.userIdentifier === userIdentifier);
                if (!userRow) {
                    return null;
                }
                return JSON.parse(userRow.tokens);
            }
            catch (error) {
                console.error('Error getting tokens:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to get tokens: ${errorMessage}`);
            }
        });
    }
    /**
     * Get valid tokens, refreshing if necessary
     */
    getValidTokens(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tokens = yield this.getTokens(userIdentifier);
                if (!tokens) {
                    return null;
                }
                // Check if tokens are expired
                if ((0, utils_1.isTokenExpired)(tokens)) {
                    // Refresh tokens
                    const refreshedTokens = yield (0, utils_1.refreshAccessToken)(tokens.refresh_token, this.config);
                    yield this.storeTokens(userIdentifier, refreshedTokens);
                    return refreshedTokens;
                }
                return tokens;
            }
            catch (error) {
                console.error('Error getting valid tokens:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to get valid tokens: ${errorMessage}`);
            }
        });
    }
    /**
     * Revoke tokens for a user
     */
    revokeTokens(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get all rows and filter
                const allRows = yield this.table.getAllRows();
                const userRow = allRows.find((row) => row.userIdentifier === userIdentifier);
                if (!userRow) {
                    return false;
                }
                yield this.table.deleteRow(userRow.ROWID);
                return true;
            }
            catch (error) {
                console.error('Error revoking tokens:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to revoke tokens: ${errorMessage}`);
            }
        });
    }
}
exports.ZohoAuthService = ZohoAuthService;

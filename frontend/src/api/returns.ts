import { apiClient } from './client';

// ---- POST /api/v1/returns/token (STAFF only) ----
export interface ReturnTokenResponse {
  token: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export const returnsApi = {
  // Staff has physically received the umbrella and generates a short-lived,
  // single-use token. The raw token is shown to the student as a QR code;
  // the student scans it in the Android app, which calls the STUDENT-only
  // POST /returns/confirm endpoint (out of scope for this web portal).
  generateToken: async (rentalId: string): Promise<ReturnTokenResponse> => {
    const { data } = await apiClient.post<ReturnTokenResponse>('/returns/token', { rentalId });
    return data;
  },
};

import axios from "axios";

/**
 * Microsoft Graph Service
 * Handles interactions with Microsoft Graph API
 */
class MicrosoftGraphService {
    constructor() {
        this.baseUrl = "https://graph.microsoft.com/v1.0";
    }

    /**
     * Fetch full employee profile from Microsoft Graph
     * @param {string} accessToken - Microsoft Graph Access Token
     * @returns {Promise<Object>} - Formatted profile data
     */
    async getProfile(accessToken) {
        try {
            console.log("Graph API: Fetching /me...");
            const response = await axios.get(`${this.baseUrl}/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    $select: "id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,employeeId,streetAddress,city,state,country"
                }
            });

            console.log("Graph API: /me response received");
            const data = response.data;

            // Safety check for displayName
            const dispName = data.displayName || "";
            const nameParts = dispName.split(' ');

            const profile = {
                microsoftId: data.id,
                firstName: data.givenName || nameParts[0] || "User",
                lastName: data.surname || nameParts.slice(1).join(' ') || '.',
                email: data.mail || data.userPrincipalName,
                designation: data.jobTitle || "Employee",
                department: data.department || "General",
                officeLocation: data.officeLocation || "Remote",
                mobileNumber: data.mobilePhone || "",
                employeeCode: data.employeeId || undefined,
                address: data.streetAddress || "",
                city: data.city || "",
                state: data.state || "",
                country: data.country || "",
                managerEmail: null
            };

            // Fetch manager separately
            try {
                console.log("Graph API: Fetching /me/manager...");
                const managerResponse = await axios.get(`${this.baseUrl}/me/manager`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { $select: "mail,userPrincipalName" }
                });
                profile.managerEmail = managerResponse.data.mail || managerResponse.data.userPrincipalName;
                console.log("Graph API: Manager found:", profile.managerEmail);
            } catch (err) {
                console.log("Graph API: No manager found or access denied.");
            }

            return profile;
        } catch (error) {
            console.error("Graph API ERROR:", error.response?.data || error.message);
            throw new Error(`Graph API fetch failed: ${error.message}`);
        }
    }

    /**
     * Fetch all users from Microsoft Graph (Batch Sync)
     * @param {string} accessToken 
     * @param {string} nextLink - For pagination
     * @returns {Promise<Object>} - { users: [], nextLink: string }
     */
    async getUsers(accessToken, nextLink = null) {
        try {
            const url = nextLink || `${this.baseUrl}/users`;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: nextLink ? {} : {
                    $select: "id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,employeeId,streetAddress,city,state,country",
                    $top: 999 // Max batch size
                }
            });

            return {
                users: response.data.value,
                nextLink: response.data["@odata.nextLink"] || null
            };
        } catch (error) {
            console.error("Graph API Batch ERROR:", error.response?.data || error.message);
            throw new Error(`Graph API batch fetch failed: ${error.message}`);
        }
    }

    /**
     * Fetch employee profile photo from Microsoft Graph
     * @param {string} accessToken - Microsoft Graph Access Token
     * @returns {Promise<Buffer|null>} - Photo buffer or null
     */
    async getProfilePhoto(accessToken, userId = "me") {
        try {
            const response = await axios.get(`${this.baseUrl}/${userId}/photo/$value`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                responseType: "arraybuffer"
            });
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                console.log(`Profile photo not found in MS Graph for ${userId}`);
                return null;
            }
            console.error(`Error fetching MS Graph photo for ${userId}:`, error.message);
            return null;
        }
    }
}

export default new MicrosoftGraphService();

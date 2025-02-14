import {
  StorageSource,
  UploadFileProps,
  UploadFileResult,
  DownloadConfig,
  StorageListResult,
} from "@firecms/core";

export interface CloudinaryStorageSourceProps {
  fetchCredentials: () => Promise<{
    cloudName: string;
    uploadPreset: string;
    apiKey?: string;
    apiSecret?: string;
  }>;
  defaultFolder?: string;
}

/**
 * Fetches Cloudinary credentials from Firestore dynamically.
 */
async function getCloudinaryCredentials() {
  return {
    cloudName: "dul7hg6so",
    uploadPreset: "ecommerce",
    apiKey: "889397845314732",
    apiSecret: "Drhr7J2DZOZplpxsjm6fNOVOvmg",
  };
}

function initializeCloudinaryClient(
  fetchCredentials: CloudinaryStorageSourceProps["fetchCredentials"],
  defaultFolder?: string
) {
  return {
    /**
     * Uploads a file to Cloudinary dynamically.
     */
    uploadFile: async (
      destinationPath: string,
      file: File,
      folder?: string
    ) => {
      const { cloudName, uploadPreset } = await fetchCredentials();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ecommerce"); // Replace with your upload preset

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        if (!data.secure_url) throw new Error("Cloudinary upload failed");

        return {
          path: data.public_id,
          bucket: cloudName,
          url: data.secure_url,
        };
      } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
        throw error;
      }
    },

    /**
     * Returns a direct download URL for an image.
     */
    getDownloadURL: async (path: string) => {

      console.log("Fetching download URL for", path);

      const { cloudName } = await fetchCredentials();
      return `https://res.cloudinary.com/${cloudName}/image/upload/${path}`;
    },

    /**
     * Fetches metadata of an image.
     */
    getMetadata: async (path: string) => {

      console.log("Fetching metadata for", path);
      

      const { cloudName } = await fetchCredentials();
      const url = `https://res.cloudinary.com/${cloudName}/image/upload/${path}`;
      return {
        bucket: cloudName,
        fullPath: path,
        name: path.split("/").pop() || "",
        size: 0,
        contentType: "image/jpeg",
        customMetadata: {},
        url,
      };
    },

    /**
     * Deletes an image using its public_id.
     */
    deleteFile: async (path: string) => {
      console.log("Deleting file", path);
      
      const { cloudName, apiKey, apiSecret } = await fetchCredentials();
      if (!apiKey || !apiSecret)
        throw new Error("Missing API key/secret for deletion");

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_id: path }),
          }
        );

        const data = await response.json();
        if (data.result !== "ok") throw new Error("Failed to delete file");
      } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        throw error;
      }
    },
  };
}

/**
 * Cloudinary Storage Source for FireCMS (with dynamic credentials)
 */
export function useCloudinaryStorageSource(): StorageSource {
  const cloudinaryClient = initializeCloudinaryClient(getCloudinaryCredentials);

  return {
    async uploadFile({
      file,
      fileName,
      path,
      bucket,
    }: UploadFileProps): Promise<UploadFileResult> {
      const usedFilename = fileName ?? file.name;
      const destinationPath = `${path}/${usedFilename}`;
      return await cloudinaryClient.uploadFile(destinationPath, file, bucket);
    },

    async getFile(path: string): Promise<File | null> {
      try {
        const url = await cloudinaryClient.getDownloadURL(path);
        const response = await fetch(url);
        const blob = await response.blob();
        return new File([blob], path);
      } catch (e) {
        return null;
      }
    },

    async getDownloadURL(path: string): Promise<DownloadConfig> {
      try {

        console.log("Fetching download URL for getDownloadURL", path);

        const url = await cloudinaryClient.getDownloadURL(path);
        const metadata = await cloudinaryClient.getMetadata(path);
        return { url, metadata };
      } catch (e) {
        return { url: null, fileNotFound: true };
      }
    },

    async deleteFile(path: string): Promise<void> {

      await cloudinaryClient.deleteFile(path);
    },

    async list(path: string): Promise<StorageListResult> {
      return {
        prefixes: [],
        items: [],
      };
    },
  };
}

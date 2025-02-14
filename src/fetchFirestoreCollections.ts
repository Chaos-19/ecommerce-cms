import { getFirestore, collection, getDocs } from "firebase/firestore";
import { buildCollection, CMSType, Properties } from "@firecms/core";

/**
 * Fetch collection names from Firestore and generate FireCMS collections.
 */
export const fetchFirestoreCollections = async () => {
  const db = getFirestore();
  const collectionNames = ["wishlists"]; // Predefined list of collection names

  return Promise.all(
    collectionNames.map(async (collectionName) => {
      const colRef = collection(db, collectionName);
      const firstDocSnapshot = await getDocs(colRef);
      const firstDoc = firstDocSnapshot.docs[0]?.data(); // Get a sample document to infer structure

      // Generate FireCMS properties dynamically
      const properties: Properties<{ [key: string]: CMSType }> = firstDoc
        ? Object.keys(firstDoc).reduce((acc, key) => {
            const value = firstDoc[key];
            let dataType:
              | "string"
              | "number"
              | "boolean"
              | "date"
              | "map"
              | "array" = "string";

            if (typeof value === "number") dataType = "number";
            else if (typeof value === "boolean") dataType = "boolean";
            else if (value instanceof Date) dataType = "date";
            else if (typeof value === "object" && !Array.isArray(value))
              dataType = "map";
            else if (Array.isArray(value)) dataType = "array";

            acc[key] = {
              name: key.charAt(0).toUpperCase() + key.slice(1),
              dataType: dataType,
            };

            return acc;
          }, {} as Properties<{ [key: string]: CMSType }>)
        : {};

      return buildCollection({
        name: collectionName.charAt(0).toUpperCase() + collectionName.slice(1),
        id: collectionName,
        path: collectionName,
        permissions: {
          read: true,
          edit: true,
          create: true,
          delete: true,
        },
        properties,
      });
    })
  );
};

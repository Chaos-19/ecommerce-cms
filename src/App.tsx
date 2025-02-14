import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  AppBar,
  Authenticator,
  CircularProgressCenter,
  Drawer,
  FireCMS,
  ModeControllerProvider,
  NavigationRoutes,
  Scaffold,
  SideDialogs,
  SnackbarProvider,
  useBuildLocalConfigurationPersistence,
  useBuildModeController,
  useBuildNavigationController,
  useValidateAuthenticator,
} from "@firecms/core";
import {
  FirebaseAuthController,
  FirebaseLoginView,
  FirebaseSignInProvider,
  FirebaseUserWrapper,
  useFirebaseAuthController,
  useFirebaseStorageSource,
  useFirestoreDelegate,
  useInitialiseFirebase,
} from "@firecms/firebase";
import { CenteredView } from "@firecms/ui";

import { firebaseConfig } from "./firebase_config";
import { productsCollection } from "./collections/products";
import { usersCollection } from "./collections/users";

import { doc, getDoc, getFirestore, setDoc } from "@firebase/firestore";
import { useCloudinaryStorageSource } from "./hooks/uploadToCloudinary";
/*
import {} from "@firecms/core";
import {
  useCloudinaryStorageSource,
  CloudinaryStorageSourceProps,
} from "./hooks/uploadToCloudinary";

const customStorageConfig: CloudinaryStorageSourceProps = {
  cloudName: "do4pudvmw",
  apiKey: "889397845314732",
  apiSecret: "Drhr7J2DZOZplpxsjm6fNOVOvmg",
  defaultFolder: "ecommerce",
};
*/

function App() {
  // Use your own authentication logic here

  const myAuthenticator: Authenticator<FirebaseUserWrapper> = useCallback(
    async ({ user, authController }) => {
      if (user?.email?.includes("flanders")) {
        throw Error("Stupid Flanders!");
      }

      console.log("User", user);

      authController.setExtra({ role: "seller" });

      const idTokenResult = await user?.firebaseUser?.getIdTokenResult();
      const userIsSuperAdmin =
        idTokenResult?.claims.admin || user?.email?.endsWith("@firecms.co");

      console.log("User is super admin", userIsSuperAdmin);

      // Reference to Firestore document
      if (!user?.uid) {
        throw new Error("User UID is undefined");
      }

      const db = getFirestore();

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      console.log("User document snapshot", userDocSnap);

      if (!userDocSnap) {
        console.log("User doesn't exist in Firestore");

        // Create a new user document
        await setDoc(userDocRef, {
          displayName: user?.displayName || "Unnamed User",
          email: user?.email,
          role: userIsSuperAdmin ? "super_admin" : "seller", // Assign role dynamically
          created_at: new Date(),
          seller_metadata: userIsSuperAdmin
            ? null
            : {
                store_name: "",
                store_address: "",
                contact_number: "",
              }, // Default seller metadata
        });
      }

      const userRole = userDocSnap.data()?.role;

      // Log and/or handle role-specific behavior
      if (userRole === "super_admin") {
        console.log("Super Admin access granted");
        // Optionally: Enrich the user object with role-specific data
        authController.setExtra({ role: "super_admin" });
        // You might also choose to load extra collections or UI elements here
      } else if (userRole === "seller") {
        console.log("Seller access granted");
        authController.setExtra({ role: "seller" });
        // Example: For sellers, you might restrict access to only their products
        // This logic could be applied in your FireCMS collections configuration
      } else {
        console.log("Access denied");
        authController.setExtra({ role: "seller" });
        //throw Error("Access denied: unauthorized role");
      }

      console.log("Allowing access to", user);
      return true; // Allow access
    },
    []
  );

  /*
  const myAuthenticator: Authenticator<FirebaseUserWrapper> = useCallback(
    async ({ user, authController }) => {
      if (user?.email?.includes("flanders")) {
        // You can throw an error to prevent access
        throw Error("Stupid Flanders!");
      }

      const idTokenResult = await user?.firebaseUser?.getIdTokenResult();
      const userIsAdmin =
        idTokenResult?.claims.admin || user?.email?.endsWith("@firecms.co");

      console.log("Allowing access to", user);

      const db = getFirestore();

      // Firestore: Check if user exists
      if (!user?.uid) {
        throw new Error("User UID is undefined");
      }

      const userDocRef = doc(db, "Users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // User doesn't exist -> Create new user document
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          role: userIsAdmin ? "admin" : "user", // Assign role
          createdAt: new Date().toISOString(),
        });
      }

      // we allow access to every user in this case
      return true;
    },
    []
  );
  const myAuthenticator: Authenticator<FirebaseUserWrapper> = useCallback(
    async ({ user, authController }) => {
      // Example check to exclude specific email patterns
      if (user?.email?.includes("flanders")) {
        throw Error("Stupid Flanders!");
      }

      // Get Firestore instance and fetch the user document
      const db = getFirestore();
      if (!user?.uid) {
        throw new Error("User UID is undefined");
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("User data not found in Firestore");
      }

      // Retrieve the user data and role
      const userData = userDoc.data();
      const userRole = userData.role;

      // Log and/or handle role-specific behavior
      if (userRole === "super_admin") {
        console.log("Super Admin access granted");
        // Optionally: Enrich the user object with role-specific data
        authController.setExtra({ role: "super_admin" });
        // You might also choose to load extra collections or UI elements here
      } else if (userRole === "seller") {
        console.log("Seller access granted");
        authController.setExtra({ role: "seller" });
        // Example: For sellers, you might restrict access to only their products
        // This logic could be applied in your FireCMS collections configuration
      } else {
        console.log("Access denied");
        throw Error("Access denied: unauthorized role");
      }

      // After the role check, return true to grant access.
      // Optionally, you can perform additional role-based redirection or state updates.
      return true;
    },
    []
  );
  const [collectionsList, setCollectionsList] = useState<any[]>([]);
  
  useEffect(() => {
    const loadCollections = async () => {
      const dynamicCollections = await fetchFirestoreCollections();
      setCollectionsList(dynamicCollections);
    };
    
    loadCollections();
  }, []);
  */

  const collections = useMemo(() => [productsCollection, usersCollection], []);

  const { firebaseApp, firebaseConfigLoading, configError } =
    useInitialiseFirebase({
      firebaseConfig,
    });

  // Controller used to manage the dark or light color mode
  const modeController = useBuildModeController();

  const signInOptions: FirebaseSignInProvider[] = ["google.com", "password"];

  // Controller for managing authentication
  const authController: FirebaseAuthController = useFirebaseAuthController({
    firebaseApp,
    signInOptions,
  });

  // Controller for saving some user preferences locally.
  const userConfigPersistence = useBuildLocalConfigurationPersistence();

  // Delegate used for fetching and saving data in Firestore
  const firestoreDelegate = useFirestoreDelegate({
    firebaseApp,
  });
  const storageSource = useCloudinaryStorageSource();
  // Controller used for saving and fetching files in storage
  /*
  const storageSource = useFirebaseStorageSource({
    firebaseApp,
  });
  */

  const { authLoading, canAccessMainView, notAllowedError } =
    useValidateAuthenticator({
      authController,
      authenticator: myAuthenticator,
      dataSourceDelegate: firestoreDelegate,
      storageSource,
    });

  const navigationController = useBuildNavigationController({
    collections,
    authController,
    dataSourceDelegate: firestoreDelegate,
  });

  if (firebaseConfigLoading || !firebaseApp) {
    return (
      <>
        <CircularProgressCenter />
      </>
    );
  }

  if (configError) {
    return <CenteredView>{configError}</CenteredView>;
  }

  return (
    <>
      <SnackbarProvider>
        <ModeControllerProvider value={modeController}>
          <FireCMS
            navigationController={navigationController}
            authController={authController}
            userConfigPersistence={userConfigPersistence}
            dataSourceDelegate={firestoreDelegate}
            storageSource={storageSource}
          >
            {({ context, loading }) => {
              if (loading || authLoading) {
                return <CircularProgressCenter size={"large"} />;
              }

              if (!canAccessMainView) {
                return (
                  <FirebaseLoginView
                    authController={authController}
                    firebaseApp={firebaseApp}
                    signInOptions={signInOptions}
                    notAllowedError={notAllowedError}
                  />
                );
              }

              return (
                <Scaffold autoOpenDrawer={false}>
                  <AppBar title={"ECOMMERCE CMS"} />
                  <Drawer />
                  <NavigationRoutes />
                  <SideDialogs />
                </Scaffold>
              );
            }}
          </FireCMS>
        </ModeControllerProvider>
      </SnackbarProvider>
    </>
  );
}

export default App;

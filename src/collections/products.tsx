import {
  buildCollection,
  buildEntityCallbacks,
  buildPropertiesOrBuilder,
  buildProperty,
  EntityIdUpdateProps,
  EntityOnDeleteProps,
  EntityOnFetchProps,
  EntityOnSaveProps,
  EntityReference,
  toSnakeCase,
  useAuthController,
  useSnackbarController,
} from "@firecms/core";

import { doc, getDoc, getFirestore, setDoc } from "@firebase/firestore";

const productCallbacks = buildEntityCallbacks({
  onPreSave: async ({
    collection,
    path,
    entityId,
    values,
    previousValues,
    status,
    context,
  }) => {
    const db = getFirestore();

    if (!context.authController.user?.uid) {
      throw new Error("User ID is undefined");
    }
    const userDocRef = doc(db, "users", context.authController.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    values.images = values?.images?.map(
      (image: { url: string; public_id: string }) => image
    );

    if (
      userDocSnap.data()?.role != "super_admin" &&
      (userDocSnap.data()?.store_name ||
        userDocSnap.data()?.store_address ||
        userDocSnap.data()?.contact_number)
    ) {
      throw new Error(
        "Please fill in your store details before adding a product"
      );
    } else if (userDocSnap.data()?.role != "super_admin") {
      values.status = "Pending";
    }

    values.seller_id = context.authController.user.uid;

    return values;
  },

  onSaveSuccess: (props: EntityOnSaveProps<Product>) => {
    console.log("onSaveSuccess", props);
  },

  onSaveFailure: (props: EntityOnSaveProps<Product>) => {
    console.log("onSaveFailure", props);
  },

  onPreDelete: ({
    collection,
    path,
    entityId,
    entity,
    context,
  }: EntityOnDeleteProps<Product>) => {
    console.log("");
  },

  onDelete: (props: EntityOnDeleteProps<Product>) => {
    console.log("onDelete", props);
  },

  onFetch({ collection, context, entity, path }: EntityOnFetchProps) {
    //entity.values.name = "Forced name";

    return entity;
  },

  onIdUpdate({
    collection,
    context,
    entityId,
    path,
    values,
  }: EntityIdUpdateProps): string {
    // return the desired ID

    return toSnakeCase(values?.name);
  },
});

export type Product = {
  name: string;
  price: number;
  status: string;
  images: {
    url: string;
    public_id: string;
  }[];
  tags: string[];
  description: string;
  categories: string[];

  metadata: object;
  stock: number;
  seller_id: string;
  created_at: Date;
};

const uploadImageToCloudinary = async (
  file: File
): Promise<{
  public_id: string;
  url: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ecommerce"); // Replace with your upload preset

  try {
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/dul7hg6so/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );
    const res = await response.json();

    return { public_id: res.public_id, url: res.secure_url };
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
};

export const productsCollection = buildCollection<Product>({
  name: "Products",
  singularName: "Product",
  id: "products",
  path: "products",
  icon: "product",
  group: "E-commerce",
  // Update permissions: only allow creation/editing/deletion if the user is a seller.
  permissions: ({ entity, path, user, authController, context }) => {
    const isAdmin =
      (authController.user &&
        entity?.values?.seller_id === authController.user?.uid) ||
      false;

    return {
      read: true,
      edit:
        authController?.extra?.role == "super_admin" ||
        (authController.user &&
          entity?.values?.seller_id === authController.user?.uid) ||
        false,
      create: true,
      delete:
        authController?.extra?.role == "super_admin" ||
        (authController.user &&
          entity?.values?.seller_id === authController.user?.uid) ||
        false,
    };
  },
  properties: {
    name: {
      name: "Name",
      validation: { required: true },
      dataType: "string",
    },
    price: {
      name: "Price",
      validation: {
        required: true,
        requiredMessage: "You must set a price between 0 and 1000",
        min: 0,
      },
      description: "Price with range validation",
      dataType: "number",
    },
    status: {
      name: "Status",
      //validation: { required: true },
      dataType: "string",
      defaultValue: "Pending",
      //disabled: true,
      description: "Should this product be visible on the website",
      longDescription:
        "Example of a long description hidden under a tooltip. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin quis bibendum turpis. Sed scelerisque ligula nec nisi pellentesque, eget viverra lorem facilisis. Praesent a lectus ac ipsum tincidunt posuere vitae non risus. In eu feugiat massa. Sed eu est non velit facilisis facilisis vitae eget ante. Nunc ut malesuada erat. Nullam sagittis bibendum porta. Maecenas vitae interdum sapien, risus. Donec finibus aliquet bibendum, tellus dui porttitor quam, quis pellentesque tellus libero non urna. Vestibulum maximus pharetra congue. Suspendisse aliquam congue quam, sed bibendum turpis. Aliquam eu enim ligula. Nam vel magna ut urna cursus sagittis. Suspendisse a nisi ac justo ornare tempor vel eu eros.",
      enumValues: {
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
      },
    },
    // Custom property for multiple images
    images: buildProperty({
      dataType: "array",
      name: "Images",
      of: {
        dataType: "string",
        storage: {
          storagePath: "images",
          acceptedFiles: ["image/*"],
          maxSize: 1024 * 1024,
          metadata: {
            cacheControl: "max-age=1000000",
          },
          fileName: async (context: { file: File }) => {
            console.log("File name context", context);

            const public_id = await uploadImageToCloudinary(context.file);

            console.log("public_id");
            console.log(public_id);

            return JSON.stringify(public_id);
          },
        },
      },
      description: "This fields allows uploading multiple images at once",
    }),
    tags: {
      name: "Tags",
      description: "Example of generic array",
      validation: { required: true },
      dataType: "array",
      of: {
        dataType: "string",
      },
    },
    description: {
      name: "Description",
      description: "This is the description of the product",
      multiline: true,
      longDescription:
        "Example of a long description hidden under a tooltip. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin quis bibendum turpis. Sed scelerisque ligula nec nisi pellentesque, eget viverra lorem facilisis. Praesent a lectus ac ipsum tincidunt posuere vitae non risus. In eu feugiat massa. Sed eu est non velit facilisis facilisis vitae eget ante. Nunc ut malesuada erat. Nullam sagittis bibendum porta. Maecenas vitae interdum sapien, ut aliquet risus. Donec aliquet, turpis finibus aliquet bibendum, tellus dui porttitor quam, quis pellentesque tellus libero non urna. Vestibulum maximus pharetra congue. Suspendisse aliquam congue quam, sed bibendum turpis. Aliquam eu enim ligula. Nam vel magna ut urna cursus sagittis. Suspendisse a nisi ac justo ornare tempor vel eu eros.",
      dataType: "string",
      columnWidth: 300,
    },
    categories: {
      name: "Categories",
      validation: { required: true },
      dataType: "array",
      of: {
        dataType: "string",
        enumValues: {
          electronics: "Electronics",
          phone: "Phones",
          tablet: "Tablets",
          laptop: "Laptops",
          airpod: "airpods",
          //charges: "Chargers",
          accessories: "Accessories",
        },
      },
    },
    metadata: {
      name: "Metadata",
      dataType: "map",
      keyValue: true,
    },
    stock: {
      name: "Stock",
      dataType: "number",
    },
    seller_id: buildProperty({
      name: "Seller ID",
      dataType: "string",
      defaultValue: "",
      readOnly: true,
      description: "Automatically set to the seller's UID",
    }),
    created_at: {
      name: "Created At",
      dataType: "date",
      autoValue: "on_create",
      readOnly: true,
    },
  },

  callbacks: productCallbacks,
});

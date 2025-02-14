import { buildCollection, buildProperty } from "@firecms/core";

export type User = {
  displayName: string;
  email: string;
  role: "super_admin" | "seller";
  created_at: Date;
  seller_metadata?: {
    store_name: string;
    store_address: string;
    contact_number: string;
  };
};

export const usersCollection = buildCollection<User>({
  name: "Users",
  singularName: "User",
  id: "users",
  path: "users",
  icon: "Person",
  group: "User Management",

  permissions: ({ authController, user ,entity}) => ({
    read:
      true,
    create:
    authController?.extra?.role == "super_admin" ||
      false,
    edit: user?.uid === authController.user?.uid ,
    delete:
     authController?.extra?.role == "super_admin" ||
      false,
  }),
  properties: {
    displayName: {
      name: "Full Name",
      validation: { required: true },
      dataType: "string",
    },
    email: {
      name: "Email",
      validation: { required: true },
      dataType: "string",
    },
    role: {
      name: "Role",
      validation: { required: true },
      dataType: "string",
      enumValues: {
        super_admin: "Super Admin",
        seller: "Seller",
      },
    },
    created_at: {
      name: "Created At",
      dataType: "date",
      autoValue: "on_create",
    },
    seller_metadata: {
      name: "Seller Metadata",
      dataType: "map",
      description: "Only applicable if the user is a seller",
      properties: {
        store_name: {
          name: "Store Name",
          dataType: "string",
          validation: { required: false },
        },
        store_address: {
          name: "Store Address",
          dataType: "string",
          validation: { required: false },
        },
        contact_number: {
          name: "Contact Number",
          dataType: "string",
          validation: { required: false },
        },
      },
    },
  },
});

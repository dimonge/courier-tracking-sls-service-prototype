import _ from "lodash";
import Ajv, { JTDSchemaType, JTDDataType } from "ajv/dist/jtd";

import * as CommonType from "./CommonType";

const ajv = new Ajv();

export type Customer = {
  id?: number;
  email: string;
  full_name: string;
  apartment_no: string | null;
  phone_number: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  latitude: any;
  longitude: any;
  company_id: number;
} & CommonType.CommonUserType &
  CommonType.CommonTimestampType;

export const CustomerSchema: JTDSchemaType<Customer> = {
  properties: {
    email: { type: "string", nullable: false },
    full_name: { type: "string", nullable: false },
    phone_number: { type: "string", nullable: false },
    address: { type: "string", nullable: false },
    city: { type: "string", nullable: false },
    postal_code: { type: "string", nullable: false },
    country: { type: "string", nullable: false },
    company_id: { type: "int32", nullable: false },
    created_at: { type: "timestamp", nullable: false },
    modified_at: { type: "timestamp", nullable: false },
    created_by: { type: "int32", nullable: false },
    modified_by: { type: "int32", nullable: false },
    apartment_no: { type: "string", nullable: true },
  },
  optionalProperties: {
    deleted_at: { type: "timestamp", nullable: true },
    id: { type: "int32", nullable: false },
    latitude: { type: "int32", nullable: true },
    longitude: { type: "int32", nullable: true },
    deleted_by: { type: "int32", nullable: true },
  },
};

export type CustomerType = JTDDataType<typeof CustomerSchema>;

export const getId = (customer: any) => {
  return _.get(customer, "id");
};

export const getCustomer = (customer: Customer) => {
  if (getId(customer)) {
    return customer;
  }
  return customer;
};
interface CreateCustomerProps {
  customer: CustomerType;
}
/*export const createCustomer = (db: DBClientType)  => {
  return async (customer: CustomerType) => {
    if (!customer) {
      throw new Error("Customer data is missing.")
    }
    // validate customer data
    const validate = ajv.compile(CustomerSchema)
    const isValid = validate(customer)
    
    if (!isValid) validate.errors;

    if (customer && !getId(customer)) {
      const cust = await null //db.customer.create({ data: customer })
      return cust;
    }
    return customer;
  }
}*/

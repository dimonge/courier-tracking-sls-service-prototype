import Ajv, { JTDSchemaType } from "ajv/dist/jtd";
import { v4 as uuidv4 } from "uuid";

const ajv = new Ajv();

export type Task = {
  id: number;
  type: string;
  tracking_code: string;
  status: string;
  pickup_time: Date;
  amount: any; // decimal is not available in typescript. Check lib later.
  vat_in_percent: any; // decimal is not available in typescript. Check lib later.

  customer_id: number;
  company_id: number;
  custom_dropoff_location?: string | null;
  pickup_location: string;
  dropoff_location: string;
  drop_off_time: Date;
  actual_pickup_time: Date | null;

  distance_in_meter: any; // decimal is not available in typescript. Check lib later.

  returned_at?: Date | null;
  actual_dropoff_time: Date | null;

  customer_signature_type: string | null;

  pickup_comments_for_courier: string | null;
  dropoff_comments_for_courier: string | null;

  order?: number | null;
  courier_id?: number | null;

  email?: string | null;
  created_by: number;
  modified_by: number;

  created_at: Date;
  modified_at: Date;
};

export const TaskSchema: JTDSchemaType<Task> = {
  properties: {
    type: { type: "string", nullable: false },
    tracking_code: { type: "string", nullable: false },
    status: { type: "string", nullable: false },
    pickup_time: { type: "timestamp", nullable: false },
    customer_id: { type: "int32", nullable: false },
    company_id: { type: "int32", nullable: false },
    created_at: { type: "timestamp", nullable: false },
    modified_at: { type: "timestamp", nullable: false },
    created_by: { type: "int32", nullable: false },
    modified_by: { type: "int32", nullable: false },
    pickup_location: { type: "string", nullable: false },
    customer_signature_type: { type: "string", nullable: true },
    actual_dropoff_time: { type: "timestamp", nullable: true },
    actual_pickup_time: { type: "timestamp", nullable: true },
    drop_off_time: { type: "timestamp", nullable: false },
    dropoff_comments_for_courier: { type: "string", nullable: true },
    dropoff_location: { type: "string", nullable: false },
    pickup_comments_for_courier: { type: "string", nullable: true },
    id: { type: "int32", nullable: false },
  },
  optionalProperties: {
    amount: { type: "int32", nullable: true },
    courier_id: { type: "int32", nullable: true },
    custom_dropoff_location: { type: "string", nullable: true },
    distance_in_meter: { type: "int32", nullable: true },
    email: { type: "string", nullable: true },
    order: { type: "int32", nullable: true },
    returned_at: { type: "timestamp", nullable: true },
    vat_in_percent: { type: "int32", nullable: true },
  },
};

export const createNewTask = (data: Task) => {
  const validate = ajv.compile(TaskSchema);

  if (validate(data)) {
    const id = uuidv4();
    return {
      ...data,
      id,
    };
  } else {
    return validate.errors;
  }
};

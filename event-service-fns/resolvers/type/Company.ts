import * as Common from "./CommonType"

export type Company = {
  id: number;
  type: string;
  name: string;
  phone_number: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  latitude: any; // decimal is not available in typescript. Check lib later.
  longitude: any; // decimal is not available in typescript. Check lib later.
  business_domain: string;
} & Common.CommonUserType 
  & Common.CommonTimestampType
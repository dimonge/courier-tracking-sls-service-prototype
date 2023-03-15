// API types
const createNewDelivery = "CREATE_NEW_DELIVERY";

type PartnerApiResolversProps = {
  type: string;
  data: any;
};

const resolversFuncs: any = {
  createNewDelivery: (data) => {
    // get delivery data
    return "new";
  },
  editDelivery: (data) => {
    return "edit";
  },
};
const getResolver = (type: string) => {
  return resolversFuncs[type];
};

const resolvers = ({ type, data }: PartnerApiResolversProps) => {
  return getResolver(type)(data);
};

export default resolvers;

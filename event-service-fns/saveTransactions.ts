
type EventProps = {

}
exports.index = async(event: EventProps, context: any) => {
  try {
    console.log("Event: ", event)
    console.log("Context: ", context)
  } catch (error) {
    console.log("SaveTransaction failed")
  }
}
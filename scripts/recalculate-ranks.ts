import { recalculateRanks } from "../src/lib/db/queries/rating"

async function main() {
  console.log("Recalculating ranks...")
  await recalculateRanks()
  console.log("Done!")
  process.exit(0)
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})

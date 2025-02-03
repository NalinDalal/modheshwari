import { NextResponse } from "next/server"
import elasticClient from "@/utils/elasticsearch"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    const result = await elasticClient.search({
      index: "users,families,events",
      body: {
        query: {
          multi_match: {
            query: query,
            fields: ["name", "surname", "email", "city", "state", "description"],
          },
        },
      },
    })

    return NextResponse.json(result.body.hits.hits)
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



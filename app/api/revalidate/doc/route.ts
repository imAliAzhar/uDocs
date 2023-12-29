/**
 * This code is responsible for revalidating queries as the dataset is updated.
 *
 * It is set up to receive a validated GROQ-powered Webhook from Sanity.io:
 * https://www.sanity.io/docs/webhooks
 *
 * 1. Go to the API section of your Sanity project on sanity.io/manage or run `npx sanity hook create`
 * 2. Click "Create webhook"
 * 3. Set the URL to https://YOUR_NEXTJS_SITE_URL/api/revalidate
 * 4. Dataset: Choose desired dataset or leave at default "all datasets"
 * 5. Trigger on: "Create", "Update", and "Delete"
 * 6. Filter: Leave empty
 * 7. Projection: {_type, "slug": slug.current}
 * 8. Status: Enable webhook
 * 9. HTTP method: POST
 * 10. HTTP Headers: Leave empty
 * 11. API version: v2021-03-25
 * 12. Include drafts: No
 * 13. Secret: Set to the same value as SANITY_REVALIDATE_SECRET (create a random secret if you haven't yet, for example by running `Math.random().toString(36).slice(2)` in your console)
 * 14. Save the cofiguration
 * 15. Add the secret to Vercel: `npx vercel env add SANITY_REVALIDATE_SECRET`
 * 16. Redeploy with `npx vercel --prod` to apply the new environment variable
 */

import { revalidateSecret } from 'lib/sanity.api'
import { revalidatePath, revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import algoliasearch from 'algoliasearch'
import { client } from 'lib/sanity.client'
import indexer, { flattenBlocks } from 'sanity-algolia'

const algolia = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID as string,
  process.env.ALGOLIA_ADMIN_API_KEY as string,
)

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<{
      _type: string
      _id: string
      slug: string
    }>(req, revalidateSecret)
    if (!isValidSignature) {
      const message = 'Invalid signature'
      return new Response(message, { status: 401 })
    }

    if (!body?._type || !body?.slug) {
      return new Response('Bad Request', { status: 400 })
    }

    const sanityAlgolia = indexer(
      {
        doc: {
          index: algolia.initIndex('docs'),
        },
      },
      async (document) => {
        switch (document._type) {
          case 'doc':
            let versionSlug = ''
            if (document.version && document.version._ref) {
              const versionDoc = await client.fetch(
                `*[_id == $versionId]{slug}[0]`,
                {
                  versionId: document.version._ref,
                },
              )
              versionSlug = versionDoc.slug.current
            }

            const fullSlug =
              document.slug.current === '/'
                ? versionSlug
                : `${versionSlug}/${document.slug.current}`

            return {
              title: document.title,
              slug: `/${document.language}/docs/${fullSlug}`,
              overview: flattenBlocks(document.overview),
            }

          default:
            throw new Error(`Unknown type: ${document.type}`)
        }
      },
    )

    await sanityAlgolia.webhookSync(client, {
      ids: { created: [body._id], updated: [], deleted: [] },
    })

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      body,
    })
  } catch (err: any) {
    console.error(err)
    return new Response(err.message, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<{
      _type: string
      _id: string
      slug: string
      language: string
      version: string
    }>(req, revalidateSecret)
    if (!isValidSignature) {
      const message = 'Invalid signature'
      return new Response(message, { status: 401 })
    }

    if (!body?._type || !body?.slug || !body?.language || !body?.version) {
      return new Response('Bad Request', { status: 400 })
    }

    const sanityAlgolia = indexer(
      {
        doc: {
          index: algolia.initIndex('docs'),
        },
      },
      async (document) => {
        switch (document._type) {
          case 'doc':
            let versionSlug = ''
            if (document.version && document.version._ref) {
              const versionDoc = await client.fetch(
                `*[_id == $versionId]{slug}[0]`,
                {
                  versionId: document.version._ref,
                },
              )
              versionSlug = versionDoc.slug.current
            }

            const fullSlug =
              document.slug.current === '/'
                ? versionSlug
                : `${versionSlug}/${document.slug.current}`

            return {
              title: document.title,
              slug: `/${document.language}/docs/${fullSlug}`,
              overview: flattenBlocks(document.overview),
            }
          default:
            throw new Error(`Unknown type: ${document.type}`)
        }
      },
    )

    await sanityAlgolia.webhookSync(client, {
      ids: { created: [], updated: [], deleted: [body._id] },
    })

    const revalidateSlug = body.slug === '/' ? '' : `/${body.slug}`

    const pathToRevalidate = `/(personal)/${body.language}/docs/${body.version}${revalidateSlug}`
    console.log(`Path To Revalidate: ${pathToRevalidate}`)

    revalidatePath(pathToRevalidate, 'page')

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      body,
    })
  } catch (err: any) {
    console.error(err)
    return new Response(err.message, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<{
      _type: string
      _id: string
      slug: string
      language: string
      version: string
    }>(req, revalidateSecret)
    if (!isValidSignature) {
      const message = 'Invalid signature'
      return new Response(message, { status: 401 })
    }

    if (!body?._type || !body?.slug || !body?.language || !body?.version) {
      return new Response('Bad Request', { status: 400 })
    }

    const sanityAlgolia = indexer(
      {
        doc: {
          index: algolia.initIndex('docs'),
        },
      },
      async (document) => {
        switch (document._type) {
          case 'doc':
            let versionSlug = ''
            if (document.version && document.version._ref) {
              const versionDoc = await client.fetch(
                `*[_id == $versionId]{slug}[0]`,
                {
                  versionId: document.version._ref,
                },
              )
              versionSlug = versionDoc.slug.current
            }

            const fullSlug =
              document.slug.current === '/'
                ? versionSlug
                : `${versionSlug}/${document.slug.current}`

            return {
              title: document.title,
              slug: `/${document.language}/docs/${fullSlug}`,
              overview: flattenBlocks(document.overview),
            }
          default:
            throw new Error(`Unknown type: ${document.type}`)
        }
      },
    )

    await sanityAlgolia.webhookSync(client, {
      ids: { created: [], updated: [body._id], deleted: [] },
    })

    const revalidateSlug = body.slug === '/' ? '' : `/${body.slug}`

    const pathToRevalidate = `/(personal)/${body.language}/docs/${body.version}${revalidateSlug}`
    console.log(`Path To Revalidate: ${pathToRevalidate}`)

    revalidatePath(pathToRevalidate, 'page')

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      body,
    })
  } catch (err: any) {
    console.error(err)
    return new Response(err.message, { status: 500 })
  }
}
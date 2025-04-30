
export const dynamic = 'force-static';

const keyRestrictions = {
  keyName: 'Signed Upload JWT',
  maxUses: 1,
  permissions: {
    endpoints: {
      data: {
        pinList: false,
        userPinnedDataTotal: false,
      },
      pinning: {
        pinFileToIPFS: true,
        pinJSONToIPFS: true,
        pinJobs: false,
        unpin: false,
        userPinPolicy: false,
      },
    },
  },
};

export async function POST() {
  try {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify(keyRestrictions),
    };

    const jwtRepsonse = await fetch(
      'https://api.pinata.cloud/users/generateApiKey',
      options
    );
    const json = (await jwtRepsonse.json()) as {JWT: string, error?: string};

    if (json.error) {
      console.error('Error response from pinata', json.error);
      return Response.json({ error: 'Internal Server Error' } , {
        status: 500,
      });
    } else {
      const { JWT } = json;
      return Response.json({ jwt: JWT });
    }
  } catch (e) {
    console.log('Error generating signed JWT', e);
    return Response.json({ error: 'Internal Server Error' }, {
      status: 500,
    });
  }
}

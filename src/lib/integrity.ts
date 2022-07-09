/**
 * @fileoverview Subresource integrity helper
 */

/**
 * Get the integrity of the asset at the URL
 * @param url Asset URL
 * @returns Integrity hash
 */
const getIntegrity = async (url: URL) =>
{
  //Fetch
  const res = await fetch(url);

  //Handle error
  if (res.status >= 300) 
  {
    throw new Error(await res.text());
  }

  //Get the buffer
  const buffer = await res.arrayBuffer();

  //Digest
  const digest = await crypto.subtle.digest('SHA-512', buffer);

  //Convert to base64
  const hash = window.btoa(
    Array.from(new Uint8Array(digest))
      .map(byte => String.fromCharCode(byte))
      .join('')
  );

  //Convert to integrity string
  const integrity = `sha512-${hash}`;

  return integrity;
};

//Export
export default getIntegrity;
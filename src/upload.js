import { SkynetClient } from "./client.js";
import { defaultOptions } from "./utils.js";

const defaultUploadOptions = {
  ...defaultOptions("/skynet/skyfile"),
  portalFileFieldname: "file",
  portalDirectoryFileFieldname: "files[]",
  customFilename: "",
};

SkynetClient.prototype.upload = async function (file, customOptions = {}) {
  const opts = { ...defaultUploadOptions, ...customOptions };

  const formData = new FormData();
  file = ensureFileObjectConsistency(file);
  const options = opts.customFilename ? { filename: opts.customFilename } : {};
  formData.append(opts.portalFileFieldname, file, options);

  const { data } = await this.executeRequest({
    ...opts,
    method: "post",
    data: formData,
  });

  return data;
};

/**
 * Uploads a local directory to Skynet.
 * @param {Object} directory - File objects to upload, indexed by their path strings.
 * @param {string} filename - The name of the directory.
 * @param {Object} [customOptions={}] - Additional settings that can optionally be set.
 * @param {string} [customOptions.endpointPath="/skynet/skyfile"] - The relative URL path of the portal endpoint to contact.
 * @param {string} [customOptions.portalDirectoryfilefieldname="files[]"] - The fieldName for directory files on the portal.
 */
SkynetClient.prototype.uploadDirectory = async function (directory, filename, customOptions = {}) {
  const opts = { ...defaultUploadOptions, ...customOptions };

  const formData = new FormData();
  Object.entries(directory).forEach(([path, file]) => {
    formData.append(opts.portalDirectoryFileFieldname, ensureFileObjectConsistency(file), path);
  });

  const { data } = await this.executeRequest({
    ...opts,
    method: "post",
    data: formData,
    query: { filename },
  });

  return data;
};

/**
 * Sometimes file object might have had the type property defined manually with
 * Object.defineProperty and some browsers (namely firefox) can have problems
 * reading it after the file has been appended to form data. To overcome this,
 * we recreate the file object using native File constructor with a type defined
 * as a constructor argument.
 * Related issue: https://github.com/NebulousLabs/skynet-webportal/issues/290
 */
function ensureFileObjectConsistency(file) {
  return new File([file], file.name, { type: file.type });
}

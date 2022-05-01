import path from 'path';
import type { GluegunToolbox } from 'gluegun';
import { Stream } from 'node:stream';

type DownloadMedia = (
  url: string | undefined,
  downloadFolder: string
) => Promise<string>;

export interface Media {
  downloadMedia: DownloadMedia;
}

const extension = (toolbox: GluegunToolbox): void => {
  const { http, filesystem } = toolbox;

  const downloader = http.create({
    baseURL: '',
    responseType: 'stream',
  });

  const downloadMedia: DownloadMedia = async (url, downloadFolder) => {
    if (!url) return '';

    const fileName = path.basename(url);
    const localFilePath = path.resolve(__dirname, downloadFolder, fileName);
    const response = await downloader.get<Stream>(
      url,
      {},
      { responseType: 'stream' }
    );

    const writer = filesystem.createWriteStream(localFilePath);
    response.data?.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('end', () => {
        resolve(localFilePath);
      });

      writer.on('error', () => {
        reject();
      });
    });
  };

  toolbox.media = {
    downloadMedia,
  };
};

export default extension;
